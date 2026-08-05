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
