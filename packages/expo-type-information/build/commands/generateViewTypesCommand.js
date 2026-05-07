"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateViewTypesCommand = generateViewTypesCommand;
const commandUtils_1 = require("./commandUtils");
const typescriptGeneration_1 = require("../typescriptGeneration");
function generateViewTypesCommand(cli) {
    return (0, commandUtils_1.addCommonOptions)(cli.command('generate-view-types')).action(async (options) => {
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
            const viewTypesFileContent = await (0, typescriptGeneration_1.generateViewTypesFileContent)(typeInfo);
            if (!viewTypesFileContent) {
                console.error("Couldn't generate view types!");
                return;
            }
            (0, commandUtils_1.writeStringToFileOrPrintToConsole)(viewTypesFileContent, realOutputPath);
        };
        (0, commandUtils_1.runCommandOnWatch)(parsedArgs, command);
    });
}
//# sourceMappingURL=generateViewTypesCommand.js.map