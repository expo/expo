'use strict';
/* eslint-env node */

// This script is just a wrapper around expotools that ensures node modules are installed
// and TypeScript files are compiled. To make it work even when node_modules are empty,
// we shouldn't eagerly require any dependency - we have to run yarn first.

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_PATH = path.dirname(__dirname);
const BUILD_PATH = path.join(ROOT_PATH, 'build');
const STATE_PATH = path.join(ROOT_PATH, 'cache', '.state.json');

function createLogModifier(modifier) {
  return (text) => {
    try {
      return modifier(require('chalk'))(text);
    } catch (e) {
      return text;
    }
  };
}
/**
 * Importing chalk directly may lead to errors
 * if it's not yet available on the machine.
 *
 * Intermediary log modifiers catch the error
 * and return unmodified string passed into the logger.
 *
 * See https://github.com/expo/expo/issues/9547
 */
const LogModifiers = {
  error: createLogModifier((chalk) => chalk.red),
  name: createLogModifier((chalk) => chalk.cyan),
  command: createLogModifier((chalk) => chalk.cyan.italic),
};

maybeRebuildAndRun().catch((error) => {
  console.error(LogModifiers.error(error.stack));
});

async function maybeRebuildAndRun() {
  const state = readState();
  const dependenciesChecksum = await calculateDependenciesChecksumAsync();
  const sourceChecksum = await calculateSourceChecksumAsync();

  // If `yarn.lock` checksum changed, reinstall expotools dependencies.
  if (!state.dependenciesChecksum || state.dependenciesChecksum !== dependenciesChecksum) {
    console.log(' 🧶 Yarning...');
    await spawnAsync('yarn', ['install']);
  }

  // If checksum of source files changed, rebuild TypeScript files.
  if (!state.sourceChecksum || state.sourceChecksum !== sourceChecksum || !buildFolderExists()) {
    console.log(` 🛠  Rebuilding ${LogModifiers.name('expotools')}`);

    try {
      // Compile TypeScript files into build folder.
      await spawnAsync('yarn', ['run', 'build']);
      state.schema = await getCommandsSchemaAsync();
    } catch (error) {
      console.error(LogModifiers.error(` 💥 Rebuilding failed: ${error.stack}`));
      process.exit(1);
    }
    console.log(` ✨ Successfully built ${LogModifiers.name('expotools')}\n`);
  }

  state.sourceChecksum = sourceChecksum || (await calculateSourceChecksumAsync());
  state.dependenciesChecksum = dependenciesChecksum || (await calculateDependenciesChecksumAsync());

  saveState(state);
  run(state.schema);
}

function buildFolderExists() {
  try {
    fs.accessSync(BUILD_PATH, fs.constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}

async function calculateChecksumAsync(options) {
  if (canRequire('folder-hash')) {
    const { hashElement } = require('folder-hash');
    const { hash } = await hashElement(ROOT_PATH, options);
    return hash;
  }
  return null;
}

async function calculateDependenciesChecksumAsync() {
  return calculateChecksumAsync({
    folders: {
      exclude: ['*'],
    },
    files: {
      include: ['yarn.lock', 'package.json'],
    },
  });
}

async function calculateSourceChecksumAsync() {
  return calculateChecksumAsync({
    folders: {
      exclude: ['build', 'cache', 'node_modules'],
    },
    files: {
      include: [
        // source files
        '**.ts',
        '**.json',
        'expotools.js',
        // swc build files
        'taskfile.js',
        'taskfile-swc.js',
        // type checking
        'tsconfig.json',
      ],
    },
  });
}

function loadCommand(program, commandFile) {
  const commandModule = require(commandFile);

  if (typeof commandModule.default !== 'function') {
    console.error(
      `Command file "${commandFile}" is not valid. Make sure to export command function as a default.`
    );
    return;
  }
  commandModule.default(program);
}

async function loadAllCommandsAsync(callback) {
  const program = require('@expo/commander');
  const { glob } = require('glob');

  const commandFiles = await glob('build/commands/*.js', {
    cwd: ROOT_PATH,
    absolute: true,
  });

  for (const commandFile of commandFiles) {
    loadCommand(program, commandFile);

    if (callback) {
      callback(commandFile, program);
    }
  }
}

async function getCommandsSchemaAsync() {
  const schema = {};

  await loadAllCommandsAsync((commandFile, program) => {
    for (const command of program.commands) {
      const names = [command._name];

      if (command._aliases) {
        names.push(...command._aliases);
      }
      for (const name of names) {
        if (!schema[name]) {
          schema[name] = path.relative(BUILD_PATH, commandFile);
        }
      }
    }
  });
  return schema;
}

function readState() {
  if (canRequire(STATE_PATH)) {
    return require(STATE_PATH);
  }
  return {
    sourceChecksum: null,
    dependenciesChecksum: null,
    schema: null,
  };
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function spawnAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = child_process.spawn(
      command,
      args,
      options || {
        stdio: ['pipe', 'ignore', 'pipe'],
        ignoreStdio: true,
        cwd: ROOT_PATH,
      }
    );

    child.on('exit', (code) => {
      child.removeAllListeners();
      resolve({ code });
    });
    child.on('error', (error) => {
      child.removeAllListeners();
      reject(error);
    });
  });
}

function canRequire(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

async function run(schema) {
  const semver = require('semver');
  const program = require('@expo/commander');
  const nodeVersion = process.versions.node.split('-')[0]; // explode and truncate tag from version

  // Validate that used Node version is supported
  if (semver.satisfies(nodeVersion, '<8.9.0')) {
    console.log(
      LogModifiers.error(
        `Node version ${LogModifiers.name(
          nodeVersion
        )} is not supported. Please use Node.js ${LogModifiers.name('8.9.0')} or higher.`
      )
    );
    process.exit(1);
  }

  try {
    const subCommandName = process.argv[2];

    if (subCommandName && !subCommandName.startsWith('-')) {
      if (!schema[subCommandName]) {
        console.log(
          LogModifiers.error(
            `${LogModifiers.command(subCommandName)} is not an expotools command.`
          ),
          LogModifiers.error(
            `Run ${LogModifiers.command('et --help')} to see a list of available commands.\n`
          )
        );
        process.exit(1);
        return;
      }

      const subCommand =
        subCommandName &&
        program.commands.find(({ _name, _aliases }) => {
          return _name === subCommandName || (_aliases && _aliases.includes(subCommandName));
        });

      if (!subCommand) {
        // If the command is known and defined in schema, load just this one command and run it.
        const commandFilePath = path.join(BUILD_PATH, schema[subCommandName]);
        loadCommand(program, commandFilePath);
      }

      // Pass args to commander and run the command.
      program.parse(process.argv);
    } else {
      await loadAllCommandsAsync();
      program.help();
    }
  } catch (e) {
    console.error(LogModifiers.error(e));
    throw e;
  }
}
