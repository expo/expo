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
      console.log(
        chalk.red(`There was an error running ${chalk.green(this._originalName)} command:`),
        chalk.red(process.env.EXPO_ET_VERBOSE ? e.stack : e.message),
      );

      if (e.stderr) {
        console.log(chalk.red('\nSTDERR:'));
        console.log(chalk.red(e.stderr));
      }
      console.log();
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
    console.error(
      chalk.red(`\nUnknown option ${chalk.yellow(flag)} for command ${chalk.green(this._originalName)}.`),
      chalk.red('See below for the full list of options.\n'),
    );
    this.help();
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

    // Add some chalks to the output.
    program.commands.forEach(command => {
      command._originalName = command._name;
      command._name = chalk.bold(chalk.green(command._name));
      command._description = `\n  ${chalk.yellow(command._description.trim())}\n`;

      command.options.forEach(option => {
        option.flags = option.flags
          .replace(/(-{1,2}\w[\w\-]*)/g, `${chalk.magenta('$1')}`)
          .replace(/(<\w+>|\[\w+\])/g, `${chalk.grey('$1')}`);
        option.description = `\n  ${chalk.yellow(option.description.trim())}\n`;
      });
    });
 
    program.parse(process.argv);

    const subCommand = process.argv[2];
    const hasSubCommand = subCommand && program.commands.some(({ _originalName, _alias }) => {
      return [_originalName, _alias].includes(subCommand);
    });

    if (!hasSubCommand) {
      subCommand && console.log(
        chalk.bold(chalk.green(subCommand)),
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
