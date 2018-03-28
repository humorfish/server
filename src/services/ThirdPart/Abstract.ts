import * as Beans from '../beans';

export interface IOAuthImpl
{
    RedirectUrl(Param: any): Promise<string>;
    Auth(Param: any): Promise<any>;
}

export interface IOAuthStaticImpl extends Beans.IThirdPartAuthorize
{
    new(): IOAuthImpl;
}
