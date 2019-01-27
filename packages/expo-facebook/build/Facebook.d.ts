declare type FacebookLoginResult = {
    type: string;
    token?: string;
    expires?: number;
};
declare type FacebookOptions = {
    permissions?: string[];
    behavior?: 'web' | 'native' | 'browser' | 'system';
};
export declare function logInWithReadPermissionsAsync(appId: string, options?: FacebookOptions): Promise<FacebookLoginResult>;
export {};
