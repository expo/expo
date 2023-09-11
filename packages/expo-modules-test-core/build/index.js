"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getStructure_1 = require("./getStructure");
const mockgen_1 = require("./mockgen");
const command = process.argv[2];
if (command === 'generate-js-mocks') {
    const modules = (0, getStructure_1.getAllExpoModulesInWorkingDirectory)();
    (0, mockgen_1.generateMocks)(modules);
}
else if (command === 'get-mocks-structure') {
    const modules = (0, getStructure_1.getAllExpoModulesInWorkingDirectory)();
    console.log(JSON.stringify(modules, null, 2));
}
else {
    console.log('Command not recognized');
}
//# sourceMappingURL=index.js.map