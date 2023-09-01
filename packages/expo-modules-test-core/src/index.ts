import { getAllExpoModulesInWorkingDirectory } from './getStructure';
import { printModules } from './mockgen';

const command = process.argv[2];

if (command === 'mockgen') {
  const modules = getAllExpoModulesInWorkingDirectory();
  printModules(modules);
} else if (command === 'getStucture') {
  const modules = getAllExpoModulesInWorkingDirectory();
  console.log(JSON.stringify(modules, null, 2));
} else {
  console.log('Command not recognized');
}
