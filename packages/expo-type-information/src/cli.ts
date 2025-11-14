import { generateMocks } from './mockgen';
import { getFileTypeInformation, serializeTypeInformation } from './typeInformation';

const usage: string =
  'yarn expo-type-information [--typinfo, --typegen-module, --typegen-view, --mockgen] <absoluteFilePath>';

if (!process.argv || process.argv.length < 3) {
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
        // console.log(await getGeneratedModuleTypesFileContent(fs.realpathSync(fileName), typeInfo));
      }
      break;
    }
    case '--typegen-view': {
      const typeInfo = getFileTypeInformation(fileName);
      if (typeInfo) {
        // console.log(await getGeneratedViewTypesFileContent(fs.realpathSync(fileName), typeInfo));
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
    default: {
      console.log(usage);
    }
  }
}
