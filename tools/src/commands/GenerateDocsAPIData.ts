import { Command } from '@expo/commander';
import { exec } from 'child_process';

type ActionOptions = {
  pkgName: string;
};

const DATA_PATH = './docs/public/static/data/unversioned';

const executeCommand = async (
  resolve,
  reject,
  pkgName,
  entryPoint = 'index',
  wholeModule = false
) => {
  const entry = wholeModule
    ? `./packages/${pkgName}/src`
    : `./packages/${pkgName}/src/${entryPoint}`;

  const tsConfigPath = `./packages/${pkgName}/tsconfig.json`;
  const jsonOutputPath = `${DATA_PATH}/${pkgName}.json`;

  exec(
    'typedoc --emit --disableSources --hideGenerator --readme none --excludePrivate --excludeProtected ' +
      `${entry} --tsconfig ${tsConfigPath} --json ${jsonOutputPath}`,
    (error, stdout, stderr) => {
      if (error && error.message && error.message.length > 0) {
        console.error(error.message);
        reject();
      } else if (stderr) {
        console.error(stderr);
        reject();
      } else {
        console.log(stdout);
        resolve();
      }
    }
  );
};

async function action({ pkgName }: ActionOptions) {
  const packagesMapping = {
    'expo-mail-composer': ['MailComposer.ts'],
  };

  if (pkgName) {
    if (packagesMapping[pkgName]) {
      new Promise((resolve, reject) => {
        executeCommand(resolve, reject, pkgName, ...packagesMapping[pkgName]);
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
        executeCommand(resolve, reject, key, ...packagesMapping[key]);
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
