export declare type FacebookLoginResult = {
    type: string;
    token?: string;
    expires?: number;
};
export declare type FacebookOptions = {
    permissions?: string[];
    behavior?: 'web' | 'native' | 'browser' | 'system';
};
