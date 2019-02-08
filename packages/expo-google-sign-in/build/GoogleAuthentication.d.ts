import GoogleAuthData from './GoogleAuthData';
declare class GoogleAuthentication extends GoogleAuthData {
    clientId?: string;
    accessToken?: string;
    accessTokenExpirationDate?: number;
    refreshToken?: string;
    idToken?: string;
    idTokenExpirationDate?: number;
    constructor(options: any);
    equals(other: any): boolean;
    toJSON(): {
        [key: string]: any;
    };
}
export default GoogleAuthentication;
