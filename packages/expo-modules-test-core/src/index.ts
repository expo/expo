import { getAllExpoModulesInWorkingDirectory } from './getStructure';
import { generateMocks } from './mockgen';

const command = process.argv[2];

if (command === 'generate-js-mocks') {
  const modules = getAllExpoModulesInWorkingDirectory();
  generateMocks(modules);
} else if (command === 'generate-ts-mocks') {
  const modules = getAllExpoModulesInWorkingDirectory();
  generateMocks(modules, 'typescript');
} else if (command === 'get-mocks-structure') {
  const modules = getAllExpoModulesInWorkingDirectory();
  console.log(JSON.stringify(modules, null, 2));
} else {
  console.log(
    'Command not recognized\n\nAvailable commands are:\n- generate-js-mocks\n- generate-ts-mocks\n- get-mocks-structure'
  );
}
