import { generateMocks } from './mockgen';
import {
  getFileTypeInformation,
  getFileTypeInformationForString,
  serializeTypeInformation,
} from './typeInformation';
import {
  getGeneratedModuleTypesFileContent,
  getGeneratedViewTypesFileContent,
} from './typescriptGeneration';
import fs from 'fs';

const usage: string =
  'yarn expo-type-information [--typinfo, --typegen-module, --typegen-view, --mockgen] <absoluteFilePath>';

if (!process.argv || process.argv.length < 3) {
  console.log('not enough arguments provided!');
  console.warn(usage);
} else {
  const command = process.argv[2];
  const fileName = process.argv[3];

  switch (command) {
    case '--typeinfo': {
      const typeInfo = getFileTypeInformation(fileName);
      if (typeInfo) {
        const typeInfoSerialized = serializeTypeInformation(typeInfo);
        console.log(JSON.stringify(typeInfoSerialized, null, 2));
      } else {
        console.log(`Provided file: ${fileName} couldn't be parsed for type infromation!`);
      }
      break;
    }
    case '--typegen-module': {
      const typeInfo = getFileTypeInformation(fileName);
      if (typeInfo) {
        getGeneratedModuleTypesFileContent(fs.realpathSync(fileName), typeInfo).then(console.log);
      }
      break;
    }
    case '--typegen-view': {
      const typeInfo = getFileTypeInformation(fileName);
      if (typeInfo) {
        getGeneratedViewTypesFileContent(fs.realpathSync(fileName), typeInfo).then(console.log);
      }
      break;
    }
    case '--mockgen': {
      const typeInfo = getFileTypeInformation(fileName);
      if (typeInfo) {
        generateMocks([typeInfo], 'typescript');
      }
      break;
    }
    case '--typegen-module-t': {
      const fileContent = process.argv[3];
      if (fileContent) {
        const typeInfo = getFileTypeInformationForString(fileContent, 'swift');
        if (typeInfo) {
          getGeneratedModuleTypesFileContent(fileContent, typeInfo).then(console.log);
        }
      }
      break;
    }
    default: {
      console.log('Invalid command');
      console.log(usage);
    }
  }
}
