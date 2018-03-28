import { IIdRequest, TIdentify, ITokenResponse} from './common';

export interface IUser
{
    Id: TIdentify;
    RefId?: TIdentify;
    Email: string;
    EmailValidated?: boolean;

    FirstName?: string;
    SurName?: string;
    AvatarUrl?: string;

    Balance?: number;
    ExtraProp?: string;
}

export interface IUserResponse extends IUser, ITokenResponse
{
}

export interface IUserAddress extends IIdRequest
{
    Country?: string;
    City?: string;
    Street?: string;
    Recipient?: string;
    Zip?: string;
    Tel?: string;

    IsDefault?: boolean;
}
