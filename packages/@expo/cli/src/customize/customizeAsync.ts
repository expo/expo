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

const templates: {
  file: string;
  dependencies: string[];
  destination: (props: DestinationResolutionProps) => string;
}[] = [
  {
    file: require.resolve('@expo/cli/static/template/babel.config.js'),
    destination: () => 'babel.config.js',
    dependencies: ['babel-preset-expo'],
  },
  {
    dependencies: ['@expo/webpack-config'],
    destination: () => 'webpack.config.js',
    file: require.resolve('@expo/cli/static/template/webpack.config.js'),
  },
  {
    dependencies: ['@expo/metro-config'],
    destination: () => 'metro.config.js',
    file: require.resolve('@expo/cli/static/template/metro.config.js'),
  },
  {
    dependencies: [],
    // web/serve.json
    destination: ({ webStaticPath }) => webStaticPath + '/serve.json',
    file: require.resolve('@expo/cli/static/template/serve.json'),
  },
  {
    dependencies: [],
    // web/index.html
    destination: ({ webStaticPath }) => webStaticPath + '/index.html',
    file: require.resolve('@expo/cli/static/template/index.html'),
  },
];

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

  const values: { title: string; value: number; description: string }[] = [];

  templates.forEach((template, index) => {
    const destination = template.destination(props);
    const localProjectFile = path.resolve(projectRoot, destination);
    const exists = fs.existsSync(localProjectFile);

    values.push({
      title: destination,
      value: index,
      description: exists ? chalk.red('This will overwrite the existing file') : '',
    });
  });

  if (files.length) {
    const valid = files.filter(
      (file) => !!templates.find((template) => template.destination(props) === file)
    );

    if (valid.length !== files.length) {
      const diff = files.filter(
        (file) => !templates.find((template) => template.destination(props) === file)
      );
      throw new CommandError(
        `Invalid files: ${diff.join(', ')}. Allowed: ${templates
          .map((template) => template.destination(props))
          .join(', ')}`
      );
    }

    Log.log(`Generating: ${valid.join(', ')}`);
    return generateAsync({
      projectRoot,
      answer: files.map((file) => {
        return templates.findIndex((template) => template.destination(props) === file);
      }),
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
  answer: number[];
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
