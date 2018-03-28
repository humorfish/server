export interface ICodeRequest
{
    appid: string;
    redirect_uri: string;
    response_type: string;
    scope: string; // 'code'
    state?: string;
}

export interface IAccessTokenRequest
{
    appid: string;
    secret: string;
    code: string;
    grant_type: string; // 'authorization_code'
}

export interface IUserInfoRequest
{
    access_token: string;
    openid: string;
    lang?: string; // zh_CN, zh_TW, en, default zh_CN
}

export interface IUserInfoResponse
{
    openid: string;
    nickname: string;
    sex: number; // 1 is man, 2 is woman
    province: string;
    city: string;
    country: string;
    headimgurl: string;
    privilege: Array<string>;
    unionid: string;
}
