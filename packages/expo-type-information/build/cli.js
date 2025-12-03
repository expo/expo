"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = __importDefault(require("commander"));
const fs_1 = __importDefault(require("fs"));
const mockgen_1 = require("./mockgen");
const typeInformation_1 = require("./typeInformation");
const typescriptGeneration_1 = require("./typescriptGeneration");
async function main(args) {
    const cli = commander_1.default
        .version(require('expo-type-information/package.json').version)
        .description('CLI commands for retrieving type information from native files.');
    typeInformationCommand(cli);
    generateModuleTypesCommand(cli);
    generateViewTypesCommand(cli);
    generateMocksForFileCommand(cli);
    await cli.parseAsync(args, { from: 'user' });
}
main(process.argv.slice(2));
function typeInformationCommand(cli) {
    return cli.command('type-information <filePath>').action((filePath) => {
        const typeInfo = (0, typeInformation_1.getFileTypeInformation)(filePath, true);
        if (typeInfo) {
            const typeInfoSerialized = (0, typeInformation_1.serializeTypeInformation)(typeInfo);
            console.log(JSON.stringify(typeInfoSerialized, null, 2));
        }
        else {
            console.log(chalk_1.default.red(`Provided file: ${filePath} couldn't be parsed for type infromation!`));
        }
    });
}
function generateModuleTypesCommand(cli) {
    return cli.command('generate-module-types <filePath>').action((filePath) => {
        const typeInfo = (0, typeInformation_1.getFileTypeInformation)(filePath, true);
        if (typeInfo) {
            (0, typescriptGeneration_1.getGeneratedModuleTypesFileContent)(fs_1.default.realpathSync(filePath), typeInfo).then(console.log);
        }
        else {
            console.log(chalk_1.default.red(`Provided file: ${filePath} couldn't be parsed for type infromation!`));
        }
    });
}
function generateViewTypesCommand(cli) {
    return cli.command('generate-view-types <filePath>').action((filePath) => {
        const typeInfo = (0, typeInformation_1.getFileTypeInformation)(filePath, true);
        if (typeInfo) {
            (0, typescriptGeneration_1.getGeneratedViewTypesFileContent)(fs_1.default.realpathSync(filePath), typeInfo).then(console.log);
        }
        else {
            console.log(chalk_1.default.red(`Provided file: ${filePath} couldn't be parsed for type infromation!`));
        }
    });
}
function generateMocksForFileCommand(cli) {
    return cli.command('generate-mocks-for-file <filePath>').action((filePath) => {
        const typeInfo = (0, typeInformation_1.getFileTypeInformation)(filePath, true);
        if (typeInfo) {
            (0, mockgen_1.generateMocks)([typeInfo], 'typescript');
        }
        else {
            console.log(chalk_1.default.red(`Provided file: ${filePath} couldn't be parsed for type infromation!`));
        }
    });
}
//# sourceMappingURL=cli.js.map