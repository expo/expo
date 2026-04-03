import chalk from 'chalk';
import commander from 'commander';
import fs from 'fs';

import { generateMocks } from './mockgen';
import { getFileTypeInformation, serializeTypeInformation } from './typeInformation';
import {
  getGeneratedJSXIntrinsicsViewDeclaration,
  getGeneratedModuleTypesFileContent,
  getGeneratedViewTypesFileContent,
} from './typescriptGeneration';

async function main(args: string[]) {
  const cli = commander
    .version(require('../package.json').version)
    .description('CLI commands for retrieving type information from native files.');

  typeInformationCommand(cli);
  generateModuleTypesCommand(cli);
  generateViewTypesCommand(cli);
  generateMocksForFileCommand(cli);
  generateJsxIntrinsics(cli);

  await cli.parseAsync(args, { from: 'user' });
}

main(process.argv.slice(2));

function typeInformationCommand(cli: commander.CommanderStatic) {
  return cli.command('type-information <filePath>').action(async (filePath: string) => {
    const typeInfo = await getFileTypeInformation(filePath, true);
    if (typeInfo) {
      const typeInfoSerialized = serializeTypeInformation(typeInfo);
      console.log(JSON.stringify(typeInfoSerialized, null, 2));
    } else {
      console.log(chalk.red(`Provided file: ${filePath} couldn't be parsed for type infromation!`));
    }
  });
}

function generateModuleTypesCommand(cli: commander.CommanderStatic) {
  return cli.command('generate-module-types <filePath>').action(async (filePath: string) => {
    const typeInfo = await getFileTypeInformation(filePath, true);
    if (typeInfo) {
      getGeneratedModuleTypesFileContent(fs.realpathSync(filePath), typeInfo).then(console.log);
    } else {
      console.log(chalk.red(`Provided file: ${filePath} couldn't be parsed for type infromation!`));
    }
  });
}

function generateViewTypesCommand(cli: commander.CommanderStatic) {
  return cli.command('generate-view-types <filePath>').action(async (filePath: string) => {
    const typeInfo = await getFileTypeInformation(filePath, true);
    if (typeInfo) {
      getGeneratedViewTypesFileContent(fs.realpathSync(filePath), typeInfo).then(console.log);
    } else {
      console.log(chalk.red(`Provided file: ${filePath} couldn't be parsed for type infromation!`));
    }
  });
}

function generateMocksForFileCommand(cli: commander.CommanderStatic) {
  return cli.command('generate-mocks-for-file <filePath>').action(async (filePath: string) => {
    const typeInfo = await getFileTypeInformation(filePath, true);
    if (typeInfo) {
      generateMocks([typeInfo], 'typescript');
    } else {
      console.log(chalk.red(`Provided file: ${filePath} couldn't be parsed for type infromation!`));
    }
  });
}

function generateJsxIntrinsics(cli: commander.CommanderStatic) {
  return cli.command('generate-jsx-intrinsics <filePath>').action(async (filePath: string) => {
    const typeInfo = await getFileTypeInformation(filePath, true);
    if (typeInfo) {
      getGeneratedJSXIntrinsicsViewDeclaration(filePath, typeInfo).then(console.log);
    } else {
      console.log(chalk.red(`Provided file: ${filePath} couldn't be parse for type information!`));
    }
  });
}
