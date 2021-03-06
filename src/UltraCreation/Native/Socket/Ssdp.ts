import {Subject} from 'rxjs/Subject';

import {TStringBuilder} from '../../Core/StringBuilder';
import {TypeInfo} from '../../Core/TypeInfo';
import {TUDPTranscever, SocketAPI, TInetAddr, INET_IP_ANY} from './Socket';
import {TUtf8Encoding} from '../../Encoding/Utf8';

const SSDP_IP: string = '239.255.255.250';
const SSDP_PORT: number = 1900;
const SSDP_HOST: string = SSDP_IP + ':' + SSDP_PORT;
const SSDP_ALIVE = 'ssdp:alive';
// const SSDP_BYEBYE = 'ssdp:byebye';
// const SSDP_UPDATE = 'ssdp:update';

const SSDP_DISCOVER = '\"ssdp:discover\"';
const SEARCH_TARGET = 'ultracreation-outpas';
const SSDP_MX: number = 3;

const SSDP_LINE_BREAK = '\r\n';

export enum TSsdpMsgType
{
    Search,
    Notify,
    FOUND
}

export const SSDP_MSG_TYPE: string[] = ['M-SEARCH', 'NOTIFY', '200 OK'];

export class TSsdpMsg
{
    static MSG_HEADER: string[] =
    [
        SSDP_MSG_TYPE[TSsdpMsgType.Search] + ' * HTTP/1.1',
        SSDP_MSG_TYPE[TSsdpMsgType.Notify] + ' * HTTP/1.1',
        'HTTP/1.1 ' + SSDP_MSG_TYPE[TSsdpMsgType.FOUND]
    ];

    static GetMsgHeader(Type: TSsdpMsgType): string
    {
        return TSsdpMsg.MSG_HEADER[Type];
    }

    constructor(TypeOrStr: TSsdpMsgType | string)
    {
        if (TypeInfo.IsString(TypeOrStr))
        {
            const Lines = TypeOrStr.split(SSDP_LINE_BREAK);
            const Header = Lines[0].trim();
            if (Header.startsWith(SSDP_MSG_TYPE[TSsdpMsgType.Search]))
                this._Type = TSsdpMsgType.Search;
            else if (Header.startsWith(SSDP_MSG_TYPE[TSsdpMsgType.Notify]))
                this._Type = TSsdpMsgType.Notify;
            else
                this._Type = TSsdpMsgType.FOUND;

            for (let i = 0; i < Lines.length; i++)
            {
                const Line = Lines[i].trim();
                const FirstSplitIdx = Line.indexOf(':');
                if (FirstSplitIdx > 0)
                {
                    // console.log('Line: ' + Line.substring(0, FirstSplitIdx) + ' ' + Line.substring(FirstSplitIdx + 1));
                    this.MsgHeaders.set(Line.substring(0, FirstSplitIdx), Line.substring(FirstSplitIdx + 1));
                }
            }
        }
        else
        {
            this._Type = TypeOrStr;
        }
    }

    get Type(): TSsdpMsgType
    {
        return this._Type;
    }

    Get(Key: string): string
    {
        return this.MsgHeaders.get(Key);
    }

    Set(Key: string, Value: string)
    {
        this.MsgHeaders.set(Key, Value);
    }

    GetHeaders()
    {
        return this.MsgHeaders;
    }

    toString(): string
    {
        const Builder = new TStringBuilder();
        Builder.Append(TSsdpMsg.MSG_HEADER[this.Type]).Append(SSDP_LINE_BREAK);

        this.MsgHeaders.forEach((Value, Key) =>
            Builder.Append(Key).Append(':').Append(Value).Append(SSDP_LINE_BREAK));

        Builder.Append(SSDP_LINE_BREAK);
        return Builder.toString();
    }

    private _Type: TSsdpMsgType;
    private MsgHeaders: Map<string, string> = new Map<string, string>();
}

export abstract class TSsdp extends TUDPTranscever
{
    static readonly KEY_IP_ADDR: string = 'KEY_IP';

    constructor()
    {
        super({});
    }

    Init()
    {
        this.OnReadReady.subscribe((SocketStream) =>
        {
            const ReadBuffer = new Uint8Array(1024);
            SocketStream.Read(ReadBuffer, 1024)
                .then((ReadedCount) =>
                {
                    if (ReadedCount < 0)
                    {
                        console.log('read null from ' + SocketStream.RemoteAddr.SocketAddr);
                        return;
                    }

                    const Response = TUtf8Encoding.Decode(ReadBuffer);
                    if (SocketStream.RemoteAddr.SocketAddr === this._LocalAddr.SocketAddr)
                    {
                        console.log('ingore packet from self');
                    }
                    else
                    {
                        console.log('addr: ' + SocketStream.RemoteAddr.SocketAddr);
                        console.log('rs: ' + Response);
                        const SsdpMsg = new TSsdpMsg(Response);
                        SsdpMsg.Set(TSsdp.KEY_IP_ADDR, SocketStream.RemoteAddr.SocketAddr);
                        this.HandleReceivedMsg(SsdpMsg);
                    }
                })
                .catch(() =>
                {
                    console.log('read err from ' + SocketStream.RemoteAddr.SocketAddr);
                });
        });
    }

    MultiCast(SsdpMsg: TSsdpMsg, Port: number = SSDP_PORT): Promise<number>
    {
        const Buffer = TUtf8Encoding.Encode(SsdpMsg.toString()).buffer;
        const RemoteAddr = new TInetAddr({Host: SSDP_IP, Port: Port}).SocketAddr;
        let OpeningSocket: Promise<void>;

        if (TypeInfo.Assigned(this._SocketId))
            OpeningSocket = Promise.resolve();
        else
            OpeningSocket = this.Open();

        return OpeningSocket
            .then(() => SocketAPI.SendTo(this._SocketId as number, Buffer, RemoteAddr));
    }

    UniCast(SsdpMsg: TSsdpMsg, SocketAddr: string): Promise<number>
    {
        const Buffer = TUtf8Encoding.Encode(SsdpMsg.toString()).buffer;
        return this.SendTo(Buffer, SocketAddr);
    }

    abstract HandleReceivedMsg(SsdpMsg: TSsdpMsg): void;
}

export class TUPnPDevice extends TSsdp
{
    EmbeddedDevices: Array<TUPnPDevice>;

    Advertise()
    {
        const AdMsg = new TSsdpMsg(TSsdpMsgType.Notify);
        AdMsg.Set('HOST', SSDP_HOST);
        AdMsg.Set('CACHE-CONTROL', 'max-age=' + 1800);
        AdMsg.Set('LOCATION', this._LocalAddr.SocketAddr);
        AdMsg.Set('NT', '');
        AdMsg.Set('NTS', SSDP_ALIVE);
        AdMsg.Set('SERVER', '');
        AdMsg.Set('USN', '');
        AdMsg.Set('BOOTID.UPNP.ORG', '');
        AdMsg.Set('CONFIGID.UPNP.ORG', '');
        AdMsg.Set('SEARCHPORT.UPNP.ORG', '');
        this.MultiCast(AdMsg);
    }

    Response()
    {
        const ResponseMsg = new TSsdpMsg(TSsdpMsgType.FOUND);
        ResponseMsg.Set('CACHE-CONTROL', 'max-age=' + 180);
        ResponseMsg.Set('DATE', '');
        ResponseMsg.Set('EXT', '');
        ResponseMsg.Set('LOCATION', this._LocalAddr.SocketAddr);
        ResponseMsg.Set('SERVER', '');
        ResponseMsg.Set('ST', SEARCH_TARGET);
        ResponseMsg.Set('USN', '');
        ResponseMsg.Set('BOOTID.UPNP.ORG', '');
        ResponseMsg.Set('CONFIGID.UPNP.ORG', '');
        ResponseMsg.Set('SEARCHPORT.UPNP.ORG', '');
        return this.UniCast(ResponseMsg, this._LocalAddr.SocketAddr);
    }

    ShutDown()
    {
    }

    HandleReceivedMsg(Msg: TSsdpMsg)
    {
        this.Response();
    }

    SendMsg(SsdpMsg: TSsdpMsg)
    {
        const Buffer = TUtf8Encoding.Encode(SsdpMsg.toString()).buffer;
        this.Broadcast(Buffer, SSDP_PORT);
    }
}

export interface INetDeviceInfo
{
    Id: string;
    Addr: string;
    Name: string;
}

export class TUPnPContrlPoint extends TSsdp
{
    SearchDevice(Target: string = SEARCH_TARGET, MX: number = SSDP_MX): Promise<number>
    {
        const SearchMsg = new TSsdpMsg(TSsdpMsgType.Search);
        SearchMsg.Set('ST', SEARCH_TARGET);
        SearchMsg.Set('HOST', SSDP_HOST);
        SearchMsg.Set('MAN', SSDP_DISCOVER);
        SearchMsg.Set('MX', MX.toString());
        return this.MultiCast(SearchMsg);
    }

    OnDeviceFound()
    {
        return this._OnDeviceFound;
    }

    HandleReceivedMsg(SsdpMsg: TSsdpMsg)
    {
        const URL: string = SsdpMsg.Get('LOCATION');
        const Target: string = SsdpMsg.Get('ST');

        if (TypeInfo.Assigned(URL) && Target.match(SEARCH_TARGET))
        {
            let DeviceAddr = TInetAddr.CreateFromSocketAddr(URL);
            if (DeviceAddr.Host === INET_IP_ANY)
            {
                const DeviceAddr_1 = TInetAddr.CreateFromSocketAddr(SsdpMsg.Get(TSsdp.KEY_IP_ADDR));
                DeviceAddr = new TInetAddr({Host: DeviceAddr_1.Host, Port: DeviceAddr.Port});
            }
            const USNStr = SsdpMsg.Get('USN');
            const DeviceId = USNStr.substring(USNStr.indexOf(':') + 1);

            const DeviceName = 'otupaswifi'; // to do...
            this._OnDeviceFound.next({Id: DeviceId, Addr: DeviceAddr.SocketAddr, Name: DeviceName});
        }
    }

    private _OnDeviceFound = new Subject<INetDeviceInfo>();
}
