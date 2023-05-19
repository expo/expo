import worker, {
  JsTransformerConfig,
  JsTransformOptions,
  TransformResponse,
} from 'metro-transform-worker';

import { matchCssModule } from './css-modules';
import { cssToReactNativeRuntime } from '../css-to-rn';

export async function nativeCssTransform(
  config: JsTransformerConfig & {
    externallyManagedCss?: Record<string, string>;
  },
  projectRoot: string,
  filename: string,
  data: Buffer,
  options: JsTransformOptions
): Promise<TransformResponse> {
  const nativeStyles = cssToReactNativeRuntime(data);

  if (matchCssModule(filename)) {
    return worker.transform(
      config,
      projectRoot,
      filename,
      Buffer.from(
        `module.exports = require("@expo/styling").StyleSheet.create(${JSON.stringify(
          nativeStyles
        )});`
      ),
      options
    );
  } else {
    return worker.transform(
      config,
      projectRoot,
      filename,
      Buffer.from(`require("@expo/styling").StyleSheet.register(${JSON.stringify(nativeStyles)});`),
      options
    );
  }
}
