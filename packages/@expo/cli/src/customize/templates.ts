import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import prompt, { ExpoChoice } from '../utils/prompts';

const debug = require('debug')('expo:customize:templates');

export type DestinationResolutionProps = {
  /** Web 'public' folder path (defaults to `/web`). This technically can be changed but shouldn't be. */
  webStaticPath: string;
  /** The Expo Router app directory. */
  appDirPath: string;
};

function importFromExpoWebpackConfig(projectRoot: string, folder: string, moduleId: string) {
  try {
    const filePath = resolveFrom(projectRoot, `@expo/webpack-config/${folder}/${moduleId}`);
    debug(`Using @expo/webpack-config template for "${moduleId}": ${filePath}`);
    return filePath;
  } catch {
    debug(`@expo/webpack-config template for "${moduleId}" not found, falling back on @expo/cli`);
  }
  return importFromVendor(projectRoot, moduleId);
}

function importFromVendor(projectRoot: string, moduleId: string) {
  try {
    const filePath = resolveFrom(projectRoot, '@expo/cli/static/template/' + moduleId);
    debug(`Using @expo/cli template for "${moduleId}": ${filePath}`);
    return filePath;
  } catch {
    // For dev mode, testing and other cases where @expo/cli is not installed
    const filePath = require.resolve(`@expo/cli/static/template/${moduleId}`);
    debug(
      `Local @expo/cli template for "${moduleId}" not found, falling back on template relative to @expo/cli: ${filePath}`
    );

    return filePath;
  }
}

export const TEMPLATES: {
  /** Unique ID for easily indexing. */
  id: string;
  /** Template file path to copy into the project. */
  file: (projectRoot: string) => string;
  /** Output location for the file in the user project. */
  destination: (props: DestinationResolutionProps) => string;
  /** List of dependencies to install in the project. These are used inside of the template file. */
  dependencies: string[];

  /** Custom step for configuring the file. Return true to exit early. */
  configureAsync?: (projectRoot: string) => Promise<boolean>;
}[] = [
  {
    id: 'babel.config.js',
    file: (projectRoot) => importFromVendor(projectRoot, 'babel.config.js'),
    destination: () => 'babel.config.js',
    dependencies: [
      // Even though this is installed in `expo`, we should add it for now.
      'babel-preset-expo',
    ],
  },
  {
    id: 'metro.config.js',
    dependencies: ['@expo/metro-config'],
    destination: () => 'metro.config.js',
    file: (projectRoot) => importFromVendor(projectRoot, 'metro.config.js'),
  },
  {
    // `tsconfig.json` is special-cased and doesn't follow the template.
    id: 'tsconfig.json',
    dependencies: [],
    destination: () => 'tsconfig.json',
    file: () => '',
    configureAsync: async (projectRoot) => {
      const { typescript } = require('./typescript') as typeof import('./typescript');
      await typescript(projectRoot);
      return true;
    },
  },
  {
    id: '.eslintrc.js',
    dependencies: [],
    destination: () => '.eslintrc.js',
    file: (projectRoot) => importFromVendor(projectRoot, '.eslintrc.js'),
    configureAsync: async (projectRoot) => {
      const { ESLintProjectPrerequisite } =
        require('../lint/ESlintPrerequisite') as typeof import('../lint/ESlintPrerequisite.js');
      const prerequisite = new ESLintProjectPrerequisite(projectRoot);
      if (!(await prerequisite.assertAsync())) {
        await prerequisite.bootstrapAsync();
      }
      return false;
    },
  },
  {
    id: 'index.html',
    file: (projectRoot) => importFromExpoWebpackConfig(projectRoot, 'web-default', 'index.html'),
    // web/index.html
    destination: ({ webStaticPath }) => webStaticPath + '/index.html',
    dependencies: [],
  },
  {
    id: 'webpack.config.js',
    file: (projectRoot) =>
      importFromExpoWebpackConfig(projectRoot, 'template', 'webpack.config.js'),
    destination: () => 'webpack.config.js',
    dependencies: ['@expo/webpack-config'],
  },
  {
    id: '+html.tsx',
    file: (projectRoot) => importFromVendor(projectRoot, '+html.tsx'),
    destination: ({ appDirPath }) => path.join(appDirPath, '+html.tsx'),
    dependencies: [],
  },
  {
    id: '+native-intent.ts',
    file: (projectRoot) => importFromVendor(projectRoot, '+native-intent.ts'),
    destination: ({ appDirPath }) => path.join(appDirPath, '+native-intent.ts'),
    dependencies: [],
  },
];

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
      description: exists ? chalk.red('This will overwrite the existing file') : undefined,
    };
  });
}

/** Prompt to select templates to add. */
export async function selectTemplatesAsync(projectRoot: string, props: DestinationResolutionProps) {
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
