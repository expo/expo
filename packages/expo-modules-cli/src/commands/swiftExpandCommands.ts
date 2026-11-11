import fs from 'fs';
import path from 'path';

import { buildExpandArgs, resolveExpandBinary, runExpand } from '../scanner/expand';
import { parseArgs } from './args';

const OPTIONS_HELP = `  --symbol <name>   Only a type ('MyModule', 'MyModule.Options') or a member
                    ('MyModule.greet') and its diagnostics. Repeatable.
  --json            Print a JSON report instead of text. The exit code is then 0
                    also when there is an error.
  --scanner <path>  Path to the Expo Modules executable. Defaults to the one of
                    the expo-modules-macros version that expo-modules-core
                    depends on.
  -h, --help        Display this message.`;

const EXPAND_HELP = `Usage: expo-modules swift:expand [options] <path...>

Prints the code that the Expo Modules macros generate for Swift sources, as
"Expand Macro" does in Xcode, without a build. A path is a .swift file or a
directory, where only the files that use one of the macros are expanded. The
macro diagnostics go to stderr, and the exit code is 1 when there is an error.

Options:
${OPTIONS_HELP}`;

const CHECK_HELP = `Usage: expo-modules swift:check [options] [path...]

Checks Swift sources for the errors and warnings of the Expo Modules macros,
without a build. A path is a .swift file or a directory (default: the current
directory). Exits with code 1 when there is an error. Errors that need type
checking still need a build.

Options:
${OPTIONS_HELP}`;

export async function swiftExpandCommand(argv: string[]) {
  await runSwiftExpand(argv, {
    command: 'swift:expand',
    help: EXPAND_HELP,
    diagnosticsOnly: false,
  });
}

export async function swiftCheckCommand(argv: string[]) {
  await runSwiftExpand(argv, { command: 'swift:check', help: CHECK_HELP, diagnosticsOnly: true });
}

async function runSwiftExpand(
  argv: string[],
  { command, help, diagnosticsOnly }: { command: string; help: string; diagnosticsOnly: boolean }
) {
  const args = parseArgs(
    {
      '--symbol': [String],
      '--json': Boolean,
      '--scanner': String,
      '--help': Boolean,
      '-h': '--help',
    },
    argv,
    `expo-modules ${command}`
  );
  if (args['--help']) {
    console.log(help);
    return;
  }

  const paths = args._.length > 0 ? args._ : diagnosticsOnly ? ['.'] : [];
  const [firstPath] = paths;
  if (firstPath === undefined) {
    throw new Error(
      `\`expo-modules ${command}\` needs at least one .swift file or directory. ` +
        `Run \`expo-modules ${command} --help\` to see the usage.`
    );
  }

  const binaryPath = args['--scanner']
    ? path.resolve(args['--scanner'])
    : resolveExpandBinary(packageDirectoryOf(firstPath));
  process.exitCode = await runExpand(
    binaryPath,
    buildExpandArgs({ paths, symbols: args['--symbol'], json: args['--json'], diagnosticsOnly })
  );
}

/**
 * The directory to find the macros from: the first path, or the directory of a file. The macros
 * resolve through `node_modules` above it, so any directory in the module package works.
 */
export function packageDirectoryOf(sourcePath: string): string {
  const resolved = path.resolve(sourcePath);
  return fs.existsSync(resolved) && fs.statSync(resolved).isFile()
    ? path.dirname(resolved)
    : resolved;
}
