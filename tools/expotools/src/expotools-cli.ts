import chalk from 'chalk';
import program, { Command } from 'commander';
import glob from 'glob';
import { install as installSourceMapSupport } from 'source-map-support';

if (process.env.NODE_ENV !== 'production') {
  installSourceMapSupport();
}

Command.prototype.asyncAction = function(asyncAction: Function) {
  return this.action(async (...args) => {
    try {
      await asyncAction(...args);
    } catch (e) {
      console.log('');
      console.log(chalk.red('========================================'));
      console.log(chalk.red('There was an error running this command:'));
      console.log(chalk.red('========================================'));
      console.log('');
      if (process.env.EXPO_ET_VERBOSE) {
        console.trace(chalk.red(e));
      } else {
        console.log(chalk.red(e.message));
      }
      if (e.stderr) {
        console.log(chalk.red('\nSTDERR:'));
        console.log(chalk.red(e.stderr));
      }
      process.exit(1);
    }
  });
};

Command.prototype.handleUnknownOptions = function(unknownOptionFn: Function) {
  this._unknownOptionHandler = unknownOptionFn;
  return this;
};

Command.prototype.unknownOption = function(flag: string) {
  if (this._allowUnknownOption) return;

  const defaultHandler = () => {
    console.error();
    console.error('  error: unknown option `%s`', flag);
    console.error();
  };

  if (this._unknownOptionHandler) {
    if (!this._unknownOptionHandler(flag)) {
      defaultHandler();
    }
  } else {
    defaultHandler();
  }
  process.exit(1);
};

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

    let subCommand = process.argv[2];
    if (subCommand) {
      let commands: string[] = [];
      program.commands.forEach(command => {
        commands.push(command['_name']);
        let alias = command['_alias'];
        if (alias) {
          commands.push(alias);
        }
      });
      if (!commands.includes(subCommand)) {
        console.log(
          `"${subCommand}" is not an expotools command. See "expotools --help" for the full list of commands.`
        );
      }
    } else {
      program.help();
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export function run() {
  runAsync().catch(e => {
    console.error('Uncaught Error', e);
    process.exit(1);
  });
}
