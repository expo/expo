import type { JsTransformerConfig, JsTransformOptions } from '@expo/metro/metro-transform-worker';

import { debugEvent } from '../events';
import {
  transformFileFullyWithNoxcturnalSync,
  type NoxcturnalMetroTransformAttempt,
} from './noxcturnal-transformer';

interface NoxcturnalFile {
  code: string;
  filename: string;
  inputFileSize: number;
  type: 'js/script' | 'js/module' | 'js/module/asset';
  ast?: unknown;
  functionMap: unknown;
  inputSourceMap?: {
    mappings: string;
    names: string[];
    originalCode: string;
  };
  hasCjsExports?: boolean;
}

interface NoxcturnalContext {
  config: JsTransformerConfig;
  projectRoot: string;
  options: JsTransformOptions;
}

export interface NoxcturnalBabelState {
  hasNonDefaultBabelConfig: boolean;
  isDefaultExpoTransformer: boolean;
}

interface NoxcturnalWorkerHooks<
  File extends NoxcturnalFile,
  Context extends NoxcturnalContext,
  Response,
> {
  completeFullTransform(
    file: File,
    context: Context,
    attempt: Extract<NoxcturnalMetroTransformAttempt, { status: 'complete' }>
  ): Promise<Response>;
}

export type NoxcturnalWorkerAttempt<Response> =
  | { status: 'complete'; response: Response }
  | { status: 'fallback' };

export function isNoxcturnalTransformWorkerEnabled(config: JsTransformerConfig): boolean {
  return (
    (
      config as JsTransformerConfig & {
        unstable_noxcturnalTransformWorker?: boolean;
      }
    ).unstable_noxcturnalTransformWorker === true
  );
}

export async function tryTransformJSWithNoxcturnal<
  File extends NoxcturnalFile,
  Context extends NoxcturnalContext,
  Response,
>(
  file: File,
  context: Context,
  state: NoxcturnalBabelState,
  hooks: NoxcturnalWorkerHooks<File, Context, Response>
): Promise<NoxcturnalWorkerAttempt<Response>> {
  const doneFullNoxcturnal = debugEvent.span();
  const fullNoxcturnal = transformFileFullyWithNoxcturnalSync({
    filename: file.filename,
    source: file.code,
    projectRoot: context.projectRoot,
    options: context.options,
    config: context.config,
    enableBabelRuntime:
      context.options.type === 'script' ? false : context.config.enableBabelRuntime,
    hasNonDefaultBabelConfig: state.hasNonDefaultBabelConfig,
    isDefaultExpoTransformer: state.isDefaultExpoTransformer,
  });
  doneFullNoxcturnal('noxcturnal:full', {
    file: debugEvent.path(file.filename),
    status: fullNoxcturnal.status,
  });
  if (fullNoxcturnal.status === 'complete') {
    return {
      status: 'complete',
      response: await hooks.completeFullTransform(file, context, fullNoxcturnal),
    };
  }
  debugEvent('noxcturnal:fallback', {
    file: debugEvent.path(file.filename),
    reason: `full-metro:${fullNoxcturnal.reason}`,
  });
  return { status: 'fallback' };
}

export function getNoxcturnalCacheKeyFiles(): readonly string[] {
  return [
    require.resolve('noxcturnal/package.json'),
    require.resolve('./metro-transform-worker'),
    require.resolve('./noxcturnal-transformer'),
    require.resolve('./plugins/cjs-detection'),
    require.resolve('./plugins/client-server-directive-boundary'),
    require.resolve('./plugins/client-server-reference-proxy'),
    require.resolve('./plugins/deep-react-native-import-warnings'),
    require.resolve('./plugins/define'),
    require.resolve('./plugins/development-public-env'),
    require.resolve('./plugins/environment-restricted-imports'),
    require.resolve('./plugins/environment-restricted-react-apis'),
    require.resolve('./plugins/expo-dom-component'),
    require.resolve('./plugins/expo-inline-manifest'),
    require.resolve('./plugins/expo-router-server-exports'),
    require.resolve('./plugins/expo-ui'),
    require.resolve('./plugins/expo-widgets'),
    require.resolve('./plugins/fix-hermes-v1-async-arrow-non-simple-params'),
    require.resolve('./plugins/fix-hermes-v1-class-in-finally'),
    require.resolve('./plugins/fix-hermes-v1-super-in-object-accessor'),
    require.resolve('./plugins/import-meta'),
    require.resolve('./plugins/inline-requires'),
    require.resolve('./plugins/metro-dependency'),
    require.resolve('./plugins/metro-esm-globals'),
    require.resolve('./plugins/metro-live-bindings'),
    require.resolve('./plugins/module-eligibility'),
    require.resolve('./plugins/native-esm-eligibility'),
    require.resolve('./plugins/platform-select'),
    require.resolve('./plugins/process-env'),
    require.resolve('./plugins/react-display-name'),
    require.resolve('./plugins/react-native-codegen'),
    require.resolve('./plugins/react-native-web'),
    require.resolve('./plugins/react-server-client-proxy'),
    require.resolve('./plugins/react-server-directive-boundary'),
    require.resolve('./plugins/react-server-module-actions'),
  ];
}
