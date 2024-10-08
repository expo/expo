import { JsTransformOptions } from '@bycedric/metro/metro-transform-worker';

function isHermesEngine(options: Pick<JsTransformOptions, 'unstable_transformProfile'>): boolean {
  // NOTE: This has multiple inputs since we also use the `customTransformOptions.engine` option to indicate the Hermes engine.
  return (
    options.unstable_transformProfile === 'hermes-canary' ||
    options.unstable_transformProfile === 'hermes-stable'
  );
}

function isBytecodeEnabled(options: Pick<JsTransformOptions, 'customTransformOptions'>): boolean {
  return options.customTransformOptions?.bytecode === '1';
}

export function shouldMinify(
  options: Pick<
    JsTransformOptions,
    'unstable_transformProfile' | 'customTransformOptions' | 'minify'
  >
): boolean {
  // If using Hermes + bytecode, then skip minification because the Hermes compiler will minify the code.
  if (isHermesEngine(options) && isBytecodeEnabled(options)) {
    return false;
  }

  return options.minify;
}
