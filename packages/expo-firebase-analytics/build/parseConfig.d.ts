export declare function isObject(item: any): boolean;
export declare function guessProjectId({ storageBucket, authDomain, databaseURL, }: {
    storageBucket?: string;
    authDomain?: string;
    databaseURL?: string;
}): string | undefined;
export declare function parseCommonConfig(data: {
    [key: string]: any;
}): {
    [key: string]: any;
};
export declare function parseAndroidConfig(data: {
    [key: string]: any;
}): {
    [key: string]: any;
};
export declare function parseIosConfig(plist: {
    [key: string]: any;
}): {
    [key: string]: any;
};
export default function parseConfig(config: {
    [key: string]: any;
}): {
    [key: string]: any;
};
