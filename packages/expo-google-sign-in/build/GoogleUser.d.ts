import GoogleAuthentication from './GoogleAuthentication';
import GoogleIdentity from './GoogleIdentity';
declare class GoogleUser extends GoogleIdentity {
    auth?: GoogleAuthentication;
    scopes: string[];
    hostedDomain?: string;
    serverAuthCode?: string;
    constructor(props: any);
    clearCache: () => Promise<any>;
    getHeaders: () => {
        [key: string]: string;
    };
    refreshAuth: () => Promise<GoogleAuthentication | undefined>;
    equals(other: any): boolean;
    toJSON(): {
        [key: string]: any;
    };
}
export default GoogleUser;
