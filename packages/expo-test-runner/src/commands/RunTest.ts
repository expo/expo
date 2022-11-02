import chalk from 'chalk';
import { CommanderStatic } from 'commander';
import * as fs from 'fs-extra';

import { Application, Config } from '../Config';
import TemplateProject from '../TemplateProject';
import { DefaultOptions, registerCommand } from '../registerCommand';

interface RunTestOptions extends DefaultOptions {
  test: string;
}

function findTest(config: Config, test: string): [string, Application] {
  for (const appName in config.applications) {
    const app = config.applications[appName];

    for (const testName in app.tests) {
      if (test === testName) {
        return [appName, app];
      }
    }
  }

  throw new Error(`Couldn't find test: ${test}`);
}

async function runTestAsync(config: Config, options: RunTestOptions) {
  const [appName, app] = findTest(config, options.test);
  const test = app.tests[options.test];

  if (app.preset === 'detox') {
    console.log(`Using ${chalk.green('detox')} preset.`);
    const preset = new TemplateProject(app, appName, options.platform, options.configFile);

    console.log(`Creating test app in ${chalk.green(options.path)}.`);
    await preset.createApplicationAsync(options.path);

    console.log(`Building app.`);
    await preset.build(options.path, test);

    console.log(`Running tests.`);
    await preset.run(options.path, test);

    if (options.shouldBeCleaned) {
      console.log(`Cleaning.`);
      await fs.remove(options.path);
    }
  } else {
    throw new Error(`Unknown preset: ${app.preset}`);
  }
}

export default (program: CommanderStatic) => {
  registerCommand(program, 'run-test', runTestAsync).option(
    '-t, --test [string]',
    'Name of the test case to run.'
  );
};
