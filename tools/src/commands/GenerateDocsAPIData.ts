import { Command } from '@expo/commander';
import chalk from 'chalk';
import { Application, TSConfigReader, TypeDocReader } from 'typedoc';
import fs from 'fs-extra';

import logger from '../Logger';

type ActionOptions = {
  packageName: string;
};

type EntryPoint = string | boolean;

type CommandAdditionalParams = [
  // TODO: figure out why Prettier don't like this type def
  // eslint-disable-next-line prettier/prettier
  entryPoint: EntryPoint,
  jsonFileName?: string
];

const DATA_PATH = './docs/public/static/data/unversioned';
const MINIFY_JSON = true;

const executeCommand = async (
  packageName: string,
  entryPoint: EntryPoint = 'index.ts',
  jsonFileName: string = packageName
) => {
  const app = new Application();

  app.options.addReader(new TSConfigReader());
  app.options.addReader(new TypeDocReader());

  const entry = `./packages/${packageName}/src${(entryPoint === true ? '' : `/${entryPoint}`)}`;
  const tsConfigPath = `./packages/${packageName}/tsconfig.json`;
  const jsonOutputPath = `${DATA_PATH}/${jsonFileName}.json`;

  app.bootstrap({
    entryPoints: [entry],
    tsconfig: tsConfigPath,
    disableSources: true,
    hideGenerator: true,
    excludePrivate: true,
    excludeProtected: true,
  });

  const project = app.convert();

  if (project) {
    await app.generateJson(project, jsonOutputPath);
    if (MINIFY_JSON) {
      await fs.writeFile(jsonOutputPath, JSON.stringify(await fs.readJson(jsonOutputPath), null, 0));
    }
  } else {
    throw new Error(`💥 Failed to extract API data from source code for '${packageName}' package.`);
  }
};

async function action({ packageName }: ActionOptions) {
  const packagesMapping: Record<string, CommandAdditionalParams> = {
    'expo-blur': ['index.ts'],
    'expo-mail-composer': ['MailComposer.ts'],
    'expo-sensors': ['Pedometer.ts', 'expo-pedometer'],
    'expo-sharing': ['Sharing.ts'],
    'expo-store-review': ['StoreReview.ts'],
    'expo-task-manager': ['TaskManager.ts'],
    'expo-tracking-transparency': ['TrackingTransparency.ts'],
  };

  if (packageName) {
    if (packagesMapping[packageName]) {
      executeCommand(packageName, ...packagesMapping[packageName]).catch(logger.error);
    } else {
      logger.warn(`🚨 Package '${packageName}' API data generation is not supported yet!`);
    }
  } else {
    try {
      const work = Object.entries(packagesMapping).map(([key, value]) => (
        executeCommand(key, ...value)
      ));
      await Promise.all(work);
      console.log(chalk.green(`\n🎉 Successful extraction of docs API data for all available packages!`));
    } catch (error) {
      logger.error(error);
    }
  }
}

export default (program: Command) => {
  program
    .command('generate-docs-api-data')
    .alias('gdad')
    .description(`Extract API data for docs using TypeDoc.`)
    .option('-p, --packageName <packageName>', 'Extract API data only for the specific package.')
    .asyncAction(action);
};
