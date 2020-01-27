import { FacebookAuth } from './Facebook';
import { FacebookLoginResult, FacebookOptions, InitOptions } from './Facebook.types';
declare const _default: {
    readonly name: string;
    initializeAsync({ appId, version, xfbml, ...options }: InitOptions): Promise<any>;
    /**
     * https://developers.facebook.com/docs/reference/javascript/FB.login/v5.0
     *
     * @param options
     */
    logInWithReadPermissionsAsync(options: FacebookOptions): Promise<FacebookLoginResult>;
    getAccessTokenAsync(): Promise<FacebookAuth | null>;
    logOutAsync(): Promise<void>;
    setAutoLogAppEventsEnabledAsync(enabled: boolean): void;
};
export default _default;
