import type { TransformOptions } from './babel-core';
export type ExpoBabelCaller = TransformOptions['caller'] & {
    babelRuntimeVersion?: string;
    metroSourceType?: 'script' | 'module' | 'asset';
    supportsReactCompiler?: boolean;
    isReactServer?: boolean;
    isHMREnabled?: boolean;
    isServer?: boolean;
    isNodeModule?: boolean;
    preserveEnvVars?: boolean;
    isDev?: boolean;
    asyncRoutes?: boolean;
    baseUrl?: string;
    engine?: string;
    bundler?: 'metro' | (string & object);
    platform?: string | null;
    routerRoot?: string;
    projectRoot: string;
};
