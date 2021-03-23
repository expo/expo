import { Command } from '@expo/commander';
import { Application, TSConfigReader, TypeDocReader } from 'typedoc';

type ActionOptions = {
  pkgName: string;
};

const DATA_PATH = './docs/public/static/data/unversioned';

const executeCommand = async (
  resolve,
  reject,
  pkgName: string,
  entryPoint: string | boolean = 'index.ts',
  jsonFileName: string = pkgName
) => {
  const app = new Application();

  app.options.addReader(new TSConfigReader());
  app.options.addReader(new TypeDocReader());

  const entry =
    entryPoint === true ? `./packages/${pkgName}/src` : `./packages/${pkgName}/src/${entryPoint}`;

  const tsConfigPath = `./packages/${pkgName}/tsconfig.json`;
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
    resolve();
  } else {
    reject();
  }
};

async function action({ pkgName }: ActionOptions) {
  const packagesMapping = {
    'expo-mail-composer': ['MailComposer.ts'],
  };

  if (pkgName) {
    if (packagesMapping[pkgName]) {
      new Promise((resolve, reject) => {
        executeCommand(resolve, reject, pkgName, ...packagesMapping[pkgName]).catch(console.error);
      }).then(
        () => {
          console.log(`🎉 Successful extraction of docs API data '${pkgName}' packages!`);
        },
        () => {
          console.error(`💥 There was an error during extraction of '${pkgName}' docs API data!`);
        }
      );
    } else {
      console.warn(`🚨 Package '${pkgName}' API data generation is not supported yet!`);
    }
  } else {
    const work = Object.keys(packagesMapping).map(key => {
      return new Promise((resolve, reject) => {
        executeCommand(resolve, reject, key, ...packagesMapping[key]).catch(console.error);
      });
    });

    Promise.all(work).then(
      () => {
        console.log(`🎉 Successful extraction of docs API data for all available packages!`);
      },
      () => {
        console.error(`💥 There was an error during extraction of docs API data!`);
      }
    );
  }
}

export default (program: Command) => {
  program
    .command('generate-docs-api-data')
    .alias('gdad')
    .description(`Extract API data for docs using TypeDoc.`)
    .option('-p, --pkgName <pkgName>', 'Extract API data only for the specific package.')
    .asyncAction(action);
};
