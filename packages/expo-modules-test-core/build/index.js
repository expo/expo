"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expo_type_information_1 = require("expo-type-information");
const command = process.argv[2];
if (command === 'generate-js-mocks') {
    const modules = (0, expo_type_information_1.getAllExpoModulesInWorkingDirectory)();
    (0, expo_type_information_1.generateMocks)(modules);
}
else if (command === 'generate-ts-mocks') {
    const modules = (0, expo_type_information_1.getAllExpoModulesInWorkingDirectory)();
    (0, expo_type_information_1.generateMocks)(modules, 'typescript');
}
else if (command === 'get-mocks-structure') {
    const modules = (0, expo_type_information_1.getAllExpoModulesInWorkingDirectory)();
    console.log(JSON.stringify(modules, null, 2));
}
else {
    console.log('Command not recognized\n\nAvailable commands are:\n- generate-js-mocks\n- generate-ts-mocks\n- get-mocks-structure');
}
//# sourceMappingURL=index.js.map