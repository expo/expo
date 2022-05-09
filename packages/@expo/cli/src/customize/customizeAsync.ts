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

const TEMPLATES: {
  /** Template file path to copy into the project. */
  file: string;
  /** Output location for the file in the user project. */
  destination: (props: DestinationResolutionProps) => string;
  /** List of dependencies to install in the project. These are used inside of the template file. */
  dependencies: string[];
}[] = [
  {
    file: require.resolve('@expo/cli/static/template/babel.config.js'),
    destination: () => 'babel.config.js',
    dependencies: [
      // Even though this is installed in `expo`, we should add it for now.
      'babel-preset-expo',
    ],
  },
  {
    file: require.resolve('@expo/cli/static/template/webpack.config.js'),
    destination: () => 'webpack.config.js',
    dependencies: ['@expo/webpack-config'],
  },
  {
    dependencies: ['@expo/metro-config'],
    destination: () => 'metro.config.js',
    file: require.resolve('@expo/cli/static/template/metro.config.js'),
  },
  {
    file: require.resolve('@expo/cli/static/template/serve.json'),
    // web/serve.json
    destination: ({ webStaticPath }) => webStaticPath + '/serve.json',
    dependencies: [],
  },
  {
    file: require.resolve('@expo/cli/static/template/index.html'),
    // web/index.html
    destination: ({ webStaticPath }) => webStaticPath + '/index.html',
    dependencies: [],
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

  TEMPLATES.forEach((template, index) => {
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
      (file) => !!TEMPLATES.find((template) => template.destination(props) === file)
    );

    if (valid.length !== files.length) {
      const diff = files.filter(
        (file) => !TEMPLATES.find((template) => template.destination(props) === file)
      );
      throw new CommandError(
        `Invalid files: ${diff.join(', ')}. Allowed: ${TEMPLATES.map((template) =>
          template.destination(props)
        ).join(', ')}`
      );
    }

    Log.log(`Generating: ${valid.join(', ')}`);
    return generateAsync({
      projectRoot,
      answer: files.map((file) => {
        return TEMPLATES.findIndex((template) => template.destination(props) === file);
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
      const template = TEMPLATES[file];
      const projectFilePath = path.resolve(projectRoot, template.destination(props));
      // copy the file from template
      return copyAsync(template.file, projectFilePath, { overwrite: true, recursive: true });
    })
  );

  // Install dependencies
  const packages = answer.map((file) => TEMPLATES[file].dependencies).flat();
  if (packages.length) {
    Log.debug('Installing ' + packages.join(', '));
    await installAsync(packages, {}, ['--dev', ...extras]);
  }
}
