import { getAllExpoModulesInWorkingDirectory } from './getStructure';
import { generateMocks } from './mockgen';

const command = process.argv[2];

if (command === 'generate-js-mocks') {
  const modules = getAllExpoModulesInWorkingDirectory();
  generateMocks(modules);
} else if (command === 'get-mocks-structure') {
  const modules = getAllExpoModulesInWorkingDirectory();
  console.log(JSON.stringify(modules, null, 2));
} else {
  console.log('Command not recognized');
}
