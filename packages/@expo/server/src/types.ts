export type ExpoRouterServerManifestV1Route<TType> = {
  dynamic: any;
  generated: boolean;
  type: TType;
  file: string;
  regex: RegExp;
  src: string;
};

export type ExpoRouterServerManifestV1FunctionRoute =
  ExpoRouterServerManifestV1Route<"dynamic">;
