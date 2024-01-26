export type ExpoRouterServerManifestV1Route<TRegex = string> = {
    page: string;
    routeKeys: Record<string, string>;
    namedRegex: TRegex;
    generated?: boolean;
};
export type ExpoRouterServerManifestV1FunctionRoute = ExpoRouterServerManifestV1Route<RegExp>;
