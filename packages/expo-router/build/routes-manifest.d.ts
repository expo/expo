export type RouteInfo<TRegex = string> = {
    dynamic: {
        name: string;
        deep: boolean;
    }[] | null;
    generated: boolean | undefined;
    type: string;
    file: string;
    regex: TRegex;
    src: string;
};
export type ExpoRoutesManifestV1<TRegex = string> = {
    functions: RouteInfo<TRegex>[];
    staticHtml: RouteInfo<TRegex>[];
    staticHtmlPaths: string[];
};
export declare function createRoutesManifest(): Promise<any>;
//# sourceMappingURL=routes-manifest.d.ts.map