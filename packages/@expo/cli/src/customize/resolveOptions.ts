import { assertUnexpectedObjectKeys, parseVariadicArguments } from '../utils/variadic';

export type Options = object;

export async function resolveArgsAsync(
  argv: string[]
): Promise<{ variadic: string[]; options: Options; extras: string[] }> {
  const { variadic, extras, flags } = parseVariadicArguments(argv);

  assertUnexpectedObjectKeys([], flags);

  return {
    // Variadic arguments like `npx expo install react react-dom` -> ['react', 'react-dom']
    variadic,
    options: {},
    extras,
  };
}
