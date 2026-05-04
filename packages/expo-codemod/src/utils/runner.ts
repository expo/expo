import Runner from 'jscodeshift/src/Runner';

import { transformFilePath } from '../transforms';

export type ParserKind = 'tsx' | 'jsx' | 'ts';

const JSCODESHIFT_PARSER: Record<ParserKind, 'tsx' | 'babel' | 'ts'> = {
  tsx: 'tsx',
  jsx: 'babel',
  ts: 'ts',
};

export async function runTransformAsync({
  files,
  parser,
  transform,
}: {
  files: string[];
  parser: ParserKind;
  transform: string;
}): ReturnType<(typeof Runner)['run']> {
  return Runner.run(transformFilePath(transform), files, {
    // Transforms are pre-compiled to JS by our build, so jscodeshift's @babel/register hook is unnecessary.
    babel: false,
    parser: JSCODESHIFT_PARSER[parser],
    verbose: 0,
    silent: true,
  });
}
