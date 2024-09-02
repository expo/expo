export declare function hasModule(name: string): boolean;
/** Determine which bundler is being used. */
export declare function getBundler(caller?: any): "metro" | "webpack" | null;
export declare function getPlatform(caller?: any): string | null | undefined;
export declare function getPossibleProjectRoot(caller?: any): string | null | undefined;
/** If bundling for a react-server target. */
export declare function getIsReactServer(caller?: any): boolean;
export declare function getIsDev(caller?: any): boolean;
export declare function getIsFastRefreshEnabled(caller?: any): boolean | undefined;
export declare function getIsProd(caller?: any): boolean;
export declare function getIsNodeModule(caller?: any): boolean;
export declare function getBaseUrl(caller?: any): string;
export declare function getReactCompiler(caller?: any): boolean;
export declare function getIsServer(caller?: any): boolean;
export declare function getExpoRouterAbsoluteAppRoot(caller?: any): string;
export declare function getInlineEnvVarsEnabled(caller?: any): boolean;
export declare function getAsyncRoutes(caller?: any): boolean;
