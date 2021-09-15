import { program, Command } from 'commander';
import fs from 'fs';
import path from 'path';

import { buildAsync } from './commands/build';
import { initAsync } from './commands/init';
import { watchAsync } from './commands/watch';
import { defaultConfig } from './shared';

program.version('0.0.1');
program.name('expo-stories');

const initCommand = new Command();

initCommand
  .name('start')
  .option(
    '-p --projectRoot <path>',
    'the directory where the RN stories app will run',
    process.cwd()
  )
  .option('-w --watchRoot <path>', 'the directory to search for .stories files', process.cwd())
  .option('--no-watch', 'disable watching source file changes', false)
  .action(async (options) => {
    const pkgPath = path.resolve(process.cwd(), 'package.json');

    if (fs.existsSync(pkgPath)) {
      const pkgJson = require(pkgPath);

      if (pkgJson.expoStories != null) {
        options = {
          ...options,
          ...pkgJson.expoStories,
        };
      }
    }

    const config = {
      ...defaultConfig,
      ...options,
    };

    config.watchRoot = path.resolve(process.cwd(), config.watchRoot);

    await initAsync(config);
    await buildAsync(config);

    if (options.watch) {
      await watchAsync(config);
    }
  });

program.addCommand(initCommand);
program.parse(process.argv);
