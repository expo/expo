import { ConfigAPI, TransformOptions } from '@babel/core';
type BabelPresetExpoPlatformOptions = {
    /** Disable or configure the `@babel/plugin-proposal-decorators` plugin. */
    decorators?: false | {
        legacy?: boolean;
        version?: number;
    };
    /** Enable or disable adding the Reanimated plugin by default. @default `true` */
    reanimated?: boolean;
    /** @deprecated Set `jsxRuntime: 'classic'` to disable automatic JSX handling.  */
    useTransformReactJSXExperimental?: boolean;
    /** Change the policy for handling JSX in a file. Passed to `plugin-transform-react-jsx`. @default `'automatic'` */
    jsxRuntime?: 'classic' | 'automatic';
    /** Change the source module ID to use when importing an automatic JSX import. Only applied when `jsxRuntime` is `'automatic'` (default). Passed to `plugin-transform-react-jsx`. @default `'react'` */
    jsxImportSource?: string;
    lazyImports?: boolean;
    disableImportExportTransform?: boolean;
    disableDeepImportWarnings?: boolean;
    disableFlowStripTypesTransform?: boolean;
    enableBabelRuntime?: boolean;
    unstable_transformProfile?: 'default' | 'hermes-stable' | 'hermes-canary';
    /** Settings to pass to `babel-plugin-react-compiler`. Set as `false` to disable the plugin. */
    'react-compiler'?: false | {
        enableUseMemoCachePolyfill?: boolean;
        compilationMode?: 'infer' | 'strict';
        panicThreshold?: 'none' | 'all_errors' | 'critical_errors';
        logger?: any;
        environment?: {
            customHooks?: unknown;
            enableResetCacheOnSourceFileChanges?: boolean;
            enablePreserveExistingMemoizationGuarantees?: boolean;
            /** @default true */
            validatePreserveExistingMemoizationGuarantees?: boolean;
            enableForest?: boolean;
            enableUseTypeAnnotations?: boolean;
            /** @default true */
            enableReactiveScopesInHIR?: boolean;
            /** @default true */
            validateHooksUsage?: boolean;
            validateRefAccessDuringRender?: boolean;
            /** @default true */
            validateNoSetStateInRender?: boolean;
            validateMemoizedEffectDependencies?: boolean;
            validateNoCapitalizedCalls?: string[] | null;
            /** @default true */
            enableAssumeHooksFollowRulesOfReact?: boolean;
            /** @default true */
            enableTransitivelyFreezeFunctionExpressions: boolean;
            enableEmitFreeze?: unknown;
            enableEmitHookGuards?: unknown;
            enableEmitInstrumentForget?: unknown;
            assertValidMutableRanges?: boolean;
            enableChangeVariableCodegen?: boolean;
            enableMemoizationComments?: boolean;
            throwUnknownException__testonly?: boolean;
            enableTreatFunctionDepsAsConditional?: boolean;
            /** Automatically enabled when reanimated plugin is added. */
            enableCustomTypeDefinitionForReanimated?: boolean;
            /** @default `null` */
            hookPattern?: string | null;
        };
        gating?: unknown;
        noEmit?: boolean;
        runtimeModule?: string | null;
        eslintSuppressionRules?: unknown | null;
        flowSuppressions?: boolean;
        ignoreUseNoForget?: boolean;
    };
    /** Enable `typeof window` runtime checks. The default behavior is to minify `typeof window` on web clients to `"object"` and `"undefined"` on servers. */
    minifyTypeofWindow?: boolean;
    /**
     * Enable that transform that converts `import.meta` to `globalThis.__ExpoImportMetaRegistry`.
     *
     * > **Note:** Use this option at your own risk. If the JavaScript engine supports `import.meta` natively, this transformation may interfere with the native implementation.
     *
     * @default `false` on client and `true` on server.
     */
    unstable_transformImportMeta?: boolean;
};
export type BabelPresetExpoOptions = BabelPresetExpoPlatformOptions & {
    /** Web-specific settings. */
    web?: BabelPresetExpoPlatformOptions;
    /** Native-specific settings. */
    native?: BabelPresetExpoPlatformOptions;
};
declare function babelPresetExpo(api: ConfigAPI, options?: BabelPresetExpoOptions): TransformOptions;
export default babelPresetExpo;
