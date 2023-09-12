// export function transform(input: { code: string; fileName: string; globalPrefix: string }): {
//   code: string;
//   dependencies: Record<string, { index: number }>;
//   optionalDependencies: unknown[];
//   dependencyMapIdent: 'dependencyMap';
// };

import { JsTransformerConfig, JsTransformOptions, TransformResponse } from 'metro-transform-worker';

export function transform(
  config: JsTransformerConfig,
  projectRoot: string,
  filename: string,
  data: string,
  options: JsTransformOptions
): TransformResponse;
