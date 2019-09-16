export declare type FacebookLoginResult = {
    type: string;
    token?: string;
    expires?: number;
};
export declare type FacebookOptions = {
    permissions?: string[];
};
export declare function logInWithReadPermissionsAsync(appId: string, options?: FacebookOptions): Promise<FacebookLoginResult>;
