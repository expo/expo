import glob from 'glob';
import chalk from 'chalk';
import program from '@expo/commander';
import { install as installSourceMapSupport } from 'source-map-support';

if (process.env.NODE_ENV !== 'production') {
  installSourceMapSupport();
}

async function runAsync() {
  try {
    program.name('expotools');
    program.version(require('../package.json').version);

    // Load each module found in ./commands by 'registering' it with our commander instance
    glob
      .sync('commands/*.js', {
        cwd: __dirname,
      })
      .forEach(file => {
        const commandModule = require(`./${file}`);
        if (typeof commandModule === 'function') {
          commandModule(program);
        } else if (typeof commandModule.default === 'function') {
          commandModule.default(program);
        } else {
          console.error(`"${file}.js" is not a properly formatted command.`);
        }
      });

    program.parse(process.argv);

    const subCommandName = process.argv[2];
    const subCommand = subCommandName && program.commands.find(({ _name, _aliases }) => {
      return _name === subCommandName || _aliases && _aliases.includes(subCommandName);
    });

    if (!subCommand) {
      subCommandName && console.log(
        chalk.bold.green(subCommandName),
        chalk.red('is not an expotools command. See below for the full list of commands.\n'),
      );
      program.help();
    }
  } catch (e) {
    console.error(chalk.red(e));
    throw e;
  }
}

export function run() {
  runAsync().catch(e => {
    console.error(
      chalk.red('Uncaught error:'),
      chalk.red(process.env.EXPO_ET_VERBOSE ? e.stack : e.message),
    );
    process.exit(1);
  });
}
