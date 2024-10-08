import { JsTransformOptions } from '@bycedric/metro/metro-transform-worker';
export declare function shouldMinify(options: Pick<JsTransformOptions, 'unstable_transformProfile' | 'customTransformOptions' | 'minify'>): boolean;
