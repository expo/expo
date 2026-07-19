import { generateMocks, getAllExpoModulesInWorkingDirectory } from 'expo-type-information';
const command = process.argv[2];

async function main(args: string[]) {
  if (command === 'generate-js-mocks') {
    const modules = await getAllExpoModulesInWorkingDirectory();
    generateMocks(modules);
  } else if (command === 'generate-ts-mocks') {
    const modules = await getAllExpoModulesInWorkingDirectory();
    generateMocks(modules, 'typescript');
  } else if (command === 'get-mocks-structure') {
    const modules = await getAllExpoModulesInWorkingDirectory();
    console.log(JSON.stringify(modules, null, 2));
  } else {
    console.log(
      'Command not recognized\n\nAvailable commands are:\n- generate-js-mocks\n- generate-ts-mocks\n- get-mocks-structure'
    );
  }
}

main(process.argv.slice(2));
