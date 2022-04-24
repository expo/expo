import { getConfig } from '@expo/config';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { installAsync } from '../install/installAsync';
import { Log } from '../log';
import { copyAsync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import { findUpProjectRootOrAssert } from '../utils/findUp';
import prompt from '../utils/prompts';
import { Options } from './resolveOptions';

type DestinationResolutionProps = {
  webStaticPath: string;
};

const templates: Record<
  string,
  {
    file: string;
    dependencies: string[];
    destination: (props: DestinationResolutionProps) => string;
  }
> = {
  'babel.config.js': {
    file: require.resolve('@expo/cli/static/template/babel.config.js'),
    destination: () => 'babel.config.js',
    dependencies: ['babel-preset-expo'],
  },
  'webpack.config.js': {
    dependencies: ['@expo/webpack-config'],
    destination: () => 'webpack.config.js',
    file: require.resolve('@expo/cli/static/template/webpack.config.js'),
  },
  'metro.config.js': {
    dependencies: ['@expo/metro-config'],
    destination: () => 'metro.config.js',
    file: require.resolve('@expo/cli/static/template/metro.config.js'),
  },
  'web/serve.json': {
    dependencies: [],
    destination: ({ webStaticPath }) => webStaticPath + '/serve.json',
    file: require.resolve('@expo/cli/static/template/serve.json'),
  },
  'web/index.html': {
    dependencies: [],
    destination: ({ webStaticPath }) => webStaticPath + '/index.html',
    file: require.resolve('@expo/cli/static/template/index.html'),
  },
};

export async function customizeAsync(files: string[], options: Options, extras: any[]) {
  // Locate the project root based on the process current working directory.
  // This enables users to run `npx expo customize` from a subdirectory of the project.
  const projectRoot = findUpProjectRootOrAssert(process.cwd());

  // Get the static path (defaults to 'web/')
  // Doesn't matter if expo is installed or which mode is used.
  const { exp } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
  });

  const props: DestinationResolutionProps = {
    webStaticPath: exp.web?.staticPath ?? 'web',
  };

  const values = [];

  for (const [file, template] of Object.entries(templates)) {
    const destination = template.destination(props);
    const localProjectFile = path.resolve(projectRoot, destination);
    const exists = fs.existsSync(localProjectFile);

    values.push({
      title: destination,
      value: file,
      description: exists ? chalk.red('This will overwrite the existing file') : '',
    });
  }

  if (files.length) {
    const valid = files.filter((file) => !!templates[file]);

    if (valid.length !== files.length) {
      const diff = files.filter((file) => !templates[file]);
      throw new CommandError(
        `Invalid files: ${diff.join(', ')}. Allowed: ${Object.keys(templates).join(', ')}`
      );
    }

    Log.log(`Generating: ${valid.join(', ')}`);
    return generateAsync({
      projectRoot,
      answer: files,
      props,
      extras,
    });
  }

  const { answer } = await prompt({
    type: 'multiselect',
    name: 'answer',
    message: 'Which files would you like to generate?',
    hint: '- Space to select. Return to submit',
    warn: 'File already exists.',
    limit: values.length,
    instructions: '',
    choices: values,
  });
  if (!answer?.length) {
    Log.exit('\n\u203A Exiting with no change...', 0);
  }
  await generateAsync({
    projectRoot,
    answer,
    props,
    extras,
  });
}

async function generateAsync({
  projectRoot,
  answer,
  props,
  extras,
}: {
  projectRoot: string;
  answer: string[];
  props: DestinationResolutionProps;
  extras: any[];
}) {
  // Copy files
  await Promise.all(
    answer.map((file) => {
      const template = templates[file];
      const projectFilePath = path.resolve(projectRoot, template.destination(props));
      // copy the file from template
      return copyAsync(template.file, projectFilePath, { overwrite: true, recursive: true });
    })
  );

  // Install dependencies
  const packages = answer.map((file) => templates[file].dependencies).flat();
  if (packages.length) {
    Log.debug('Installing ' + packages.join(', '));
    await installAsync(packages, {}, ['--dev', ...extras]);
  }
}
