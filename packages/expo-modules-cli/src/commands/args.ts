import arg from 'arg';

/**
 * Parses `argv` against `spec`. An unknown option, or an option without its value, throws an
 * error that points to the `--help` of `command`.
 */
export function parseArgs<T extends arg.Spec>(
  spec: T,
  argv: string[],
  command: string,
  options: Omit<arg.Options, 'argv'> = {}
): arg.Result<T> {
  try {
    return arg(spec, { ...options, argv });
  } catch (error) {
    if (error instanceof arg.ArgError) {
      throw new Error(`${error.message}. Run \`${command} --help\` to see the options.`);
    }
    throw error;
  }
}
