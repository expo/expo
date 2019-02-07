import GoogleAuthentication from './GoogleAuthentication';
import GoogleIdentity from './GoogleIdentity';
declare class GoogleUser extends GoogleIdentity {
    auth: GoogleAuthentication | null;
    scopes: string[];
    hostedDomain?: string;
    serverAuthCode?: string;
    constructor(options: any);
    clearCache: () => Promise<any>;
    getHeaders: () => {
        [key: string]: string;
    };
    refreshAuth: () => Promise<GoogleAuthentication | null>;
    equals(other: any): boolean;
    toJSON(): {
        [key: string]: any;
    };
}
export default GoogleUser;
