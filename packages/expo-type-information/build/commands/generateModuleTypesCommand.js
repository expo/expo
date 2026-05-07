"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModuleTypesCommand = generateModuleTypesCommand;
const chalk_1 = __importDefault(require("chalk"));
const commandUtils_1 = require("./commandUtils");
const typescriptGeneration_1 = require("../typescriptGeneration");
function generateModuleTypesCommand(cli) {
    return (0, commandUtils_1.addCommonOptions)(cli.command('generate-module-types')).action(async (options) => {
        const parsedArgs = await (0, commandUtils_1.parseCommandArguments)(options);
        if (!parsedArgs) {
            return;
        }
        const { realOutputPath } = parsedArgs;
        const command = async () => {
            const typeInfo = await (0, commandUtils_1.getFileTypeInformationFromArgs)(parsedArgs);
            if (!typeInfo) {
                return;
            }
            const moduleTypesFileContent = await (0, typescriptGeneration_1.generateModuleTypesFileContent)(typeInfo);
            if (!moduleTypesFileContent) {
                console.error(chalk_1.default.red(`Couldn't generate module types file content!`));
                return;
            }
            (0, commandUtils_1.writeStringToFileOrPrintToConsole)(moduleTypesFileContent, realOutputPath);
        };
        (0, commandUtils_1.runCommandOnWatch)(parsedArgs, command);
    });
}
//# sourceMappingURL=generateModuleTypesCommand.js.map