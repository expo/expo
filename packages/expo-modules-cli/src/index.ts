import { parseArgs } from './commands/args';
import { generateTypesCommand } from './commands/generateTypesCommand';
import { swiftCheckCommand, swiftExpandCommand } from './commands/swiftExpandCommands';

const HELP = `Usage: expo-modules [options] <command>

Command-line tools for developing Expo modules.

Commands:
  generate-types [packageDir]  Generates TypeScript types for the native API an
                               Expo module exports to JavaScript.
  swift:expand <path...>       Prints the code that the Swift macros generate.
  swift:check [path...]        Checks Swift sources for macro errors without a
                               build.

A command with a language prefix, such as swift:, uses the tools of that
language. A command without one gives the same result for every language.

Options:
  -v, --version  Display the version number.
  -h, --help     Display this message.

Run \`expo-modules <command> --help\` to see the options of a command.`;

async function main(argv: string[]) {
  const args = parseArgs(
    {
      '--version': Boolean,
      '--help': Boolean,
      '-v': '--version',
      '-h': '--help',
    },
    argv,
    'expo-modules',
    // The arguments from the command name on are the command's, which parses them itself.
    { stopAtPositional: true }
  );
  if (args['--version']) {
    console.log(require('../package.json').version);
    return;
  }

  const [command, ...commandArgv] = args._;
  if (args['--help']) {
    commandArgv.push('--help');
  }
  switch (command) {
    case 'generate-types':
      await generateTypesCommand(commandArgv);
      break;
    case 'swift:expand':
      await swiftExpandCommand(commandArgv);
      break;
    case 'swift:check':
      await swiftCheckCommand(commandArgv);
      break;
    case undefined:
      if (args['--help']) {
        console.log(HELP);
      } else {
        console.error(HELP);
        process.exitCode = 1;
      }
      break;
    default:
      throw new Error(
        `Unknown command \`${command}\`. Run \`expo-modules --help\` to see the commands.`
      );
  }
}

module.exports = main;
