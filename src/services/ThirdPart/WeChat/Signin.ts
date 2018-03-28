import { IOAuthImpl, IOAuthStaticImpl } from '../Abstract';
import { TypeInfo } from '../../../UltraCreation/Core/TypeInfo';
import { EInvalidArg } from '../../../UltraCreation/Core/Exception';
import { THttpClient, TRestClient } from '../../../UltraCreation/Core/Http';

import * as Api from './Intf';
import * as Beans from '../../beans';

const AppIdSecrets =
[
    {Id: 'wxb4fd13a5f6f5a7c2', Secret: '58652b91398ba8388dcbb095f427a9d3'}
];

const ConnectHost = 'https://open.weixin.qq.com';
const ApiHost = 'https://api.weixin.qq.com';
const ConnectApi = '/connect/qrconnect';
const AccessTokenApi = '/sns/oauth2/access_token';
const UserInfoApi = '/sns/userinfo';

@TypeInfo.StaticImplements<IOAuthStaticImpl>()
export class TWeChatAuthService implements IOAuthImpl
{
    async RedirectUrl(Param: any): Promise<string>
    {
        if (! TypeInfo.Assigned(Param.AppId) || ! TypeInfo.Assigned(Param.RedirectUri))
            throw new EInvalidArg();

        const Queries: Api.ICodeRequest = {
            appid: Param.AppId, redirect_uri: Param.RedirectUri, response_type: 'code', scope: 'snsapi_userinfo'
        };
        if (TypeInfo.Assigned(Param.State))
            Queries.state = Param.State;

        return ConnectHost + ConnectApi + '?' + THttpClient.UrlEncode(Queries);
    }

    async Auth(Param: any): Promise<any>
    {
        if (! TypeInfo.Assigned(Param.AppId) || ! TypeInfo.Assigned(Param.Code))
            throw new EInvalidArg();

        const Token = await this.Token(Param.AppId, Param.Code);
        if (! TypeInfo.Assigned(Token) || ! TypeInfo.Assigned(Token.access_token))
            throw new EInvalidArg(JSON.stringify(Token));

        const UserInfo = await this.UserInfo(Token.access_token, Token.openid);
        const RetVal = await this.StoreUser(UserInfo);
        RetVal.Token = Authorization.Generate(7 * 86400, {Id: RetVal.Id});

    }

    async Token(AppId: string, Code: string): Promise<any>
    {
        const AppSecret = this.AppSecret(AppId);
        if (! TypeInfo.Assigned(AppSecret))
            return null;

        const Http = new TRestClient(ApiHost);
        const Queries: Api.IAccessTokenRequest = {
            appid: AppId, secret: AppSecret, code: Code, grant_type: 'authorization_code'
        };

        return await Http.Get(AccessTokenApi, Queries).toPromise().then(res => res.Content);
    }

    async UserInfo(Token: string, OpenId: string): Promise<Api.IUserInfoResponse>
    {
        const Queries: Api.IUserInfoRequest = {
            access_token: Token, openid: OpenId
        };
        const Http = new TRestClient(ApiHost);
        const UserInfo = await Http.Get(UserInfoApi, Queries).toPromise().then((res) => res.Content);
        return UserInfo;
    }

    private async StoreUser(UserInfo: Api.IUserInfoResponse): Promise<Beans.IUser>
    {
        return null;
    }

    private AppSecret(AppId: string): string
    {
        for (const IdSecret of AppIdSecrets)
        {
            if (IdSecret.Id === AppId)
                return IdSecret.Secret;
        }

        return null;
    }
}
