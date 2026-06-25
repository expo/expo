import type { CommanderStatic } from 'commander';
import { styleText } from 'node:util';

import type { Config } from '../Config';
import TemplateProject from '../TemplateProject';
import type { DefaultOptions } from '../registerCommand';
import { registerCommand } from '../registerCommand';

interface CreateProjectOptions extends DefaultOptions {
  app: string;
}

async function createProjectAsync(config: Config, options: CreateProjectOptions) {
  const app = config.applications[options.app];

  if (app?.preset === 'detox') {
    console.log(`Using ${styleText('green', 'detox')} preset.`);
    const preset = new TemplateProject(app, options.app, options.platform, options.configFile);

    console.log(`Creating test app in ${styleText('green', options.path)}.`);
    await preset.createApplicationAsync(options.path);
  } else {
    throw new Error(`Unknown preset: ${app?.preset}`);
  }
}

export default (program: CommanderStatic) => {
  registerCommand(program, 'create-project', createProjectAsync).option(
    '-a, --app [string]',
    'Name of the application to create.'
  );
};
