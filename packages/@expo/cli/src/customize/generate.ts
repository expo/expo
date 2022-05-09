import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { installAsync } from '../install/installAsync';
import { Log } from '../log';
import { copyAsync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import prompt, { ExpoChoice } from '../utils/prompts';

export type DestinationResolutionProps = {
  /** Web 'public' folder path (defaults to `/web`). This technically can be changed but shouldn't be. */
  webStaticPath: string;
};

export const TEMPLATES: {
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

export async function queryAndGenerateAsync(
  projectRoot: string,
  {
    files,
    props,
    extras,
  }: {
    files: string[];
    props: DestinationResolutionProps;
    /** Any extra props to pass to the install command. */
    extras: any[];
  }
) {
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
  return generateAsync(projectRoot, {
    answer: files.map((file) =>
      TEMPLATES.findIndex((template) => template.destination(props) === file)
    ),
    props,
    extras,
  });
}

/** Generate the prompt choices. */
function createChoices(
  projectRoot: string,
  props: DestinationResolutionProps
): ExpoChoice<number>[] {
  return TEMPLATES.map((template, index) => {
    const destination = template.destination(props);
    const localProjectFile = path.resolve(projectRoot, destination);
    const exists = fs.existsSync(localProjectFile);

    return {
      title: destination,
      value: index,
      description: exists ? chalk.red('This will overwrite the existing file') : '',
    };
  });
}

async function selectTemplatesAsync(projectRoot: string, props: DestinationResolutionProps) {
  const options = createChoices(projectRoot, props);

  const { answer } = await prompt({
    type: 'multiselect',
    name: 'answer',
    message: 'Which files would you like to generate?',
    hint: '- Space to select. Return to submit',
    warn: 'File already exists.',
    limit: options.length,
    instructions: '',
    choices: options,
  });
  return answer;
}

/** Select templates to generate then generate and install. */
export async function selectAndGenerateAsync(
  projectRoot: string,
  {
    props,
    extras,
  }: {
    props: DestinationResolutionProps;
    /** Any extra props to pass to the install command. */
    extras: any[];
  }
) {
  const answer = await selectTemplatesAsync(projectRoot, props);

  if (!answer?.length) {
    Log.exit('\n\u203A Exiting with no change...', 0);
  }

  await generateAsync(projectRoot, {
    answer,
    props,
    extras,
  });
}

async function generateAsync(
  projectRoot: string,
  {
    answer,
    props,
    extras,
  }: {
    answer: number[];
    props: DestinationResolutionProps;
    /** Any extra props to pass to the install command. */
    extras: any[];
  }
) {
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
