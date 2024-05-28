import { type ExpoBabelCaller } from '@expo/metro-config/build/babel-transformer';
export declare function hasModule(name: string): boolean;
/** Determine which bundler is being used. */
export declare function getBundler(caller?: ExpoBabelCaller): "metro" | "webpack" | null;
export declare function getPlatform(caller?: ExpoBabelCaller): string | null | undefined;
export declare function getPossibleProjectRoot(caller?: ExpoBabelCaller): string | null | undefined;
/** If bundling for a react-server target. */
export declare function getIsReactServer(caller?: ExpoBabelCaller): boolean;
export declare function getIsDev(caller?: ExpoBabelCaller): boolean;
export declare function getIsFastRefreshEnabled(caller?: ExpoBabelCaller): boolean | undefined;
export declare function getIsProd(caller?: ExpoBabelCaller): boolean;
export declare function getIsNodeModule(caller?: ExpoBabelCaller): boolean;
export declare function getBaseUrl(caller?: ExpoBabelCaller): string;
export declare function getReactCompiler(caller?: ExpoBabelCaller): boolean;
export declare function getIsServer(caller?: ExpoBabelCaller): boolean;
export declare function getExpoRouterAbsoluteAppRoot(caller?: ExpoBabelCaller): string;
export declare function getInlineEnvVarsEnabled(caller?: ExpoBabelCaller): boolean;
export declare function getAsyncRoutes(caller?: ExpoBabelCaller): boolean;
