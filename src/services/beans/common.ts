export type TIdentify = string;
export type TRegionName = string;

/* request for login */

export interface IUserAuthorize
{
    Email?: string;
    Password?: string;
}

export interface IThirdPartAuthorize
{
    RefSource?: string;
}

/** response for Token only */

export interface ITokenResponse
{
    Token: string;
}

/** request need UUID only */

export interface IIdRequest
{
    Id: TIdentify;
}
