"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJsxIntrinsics = generateJsxIntrinsics;
const commandUtils_1 = require("./commandUtils");
const typescriptGeneration_1 = require("../typescriptGeneration");
function generateJsxIntrinsics(cli) {
    return (0, commandUtils_1.addCommonOptions)(cli.command('generate-jsx-intrinsics')).action(async (options) => {
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
            const jsxIntrinsicViewFileContent = await (0, typescriptGeneration_1.generateJSXIntrinsicsFileContent)(typeInfo);
            if (!jsxIntrinsicViewFileContent) {
                console.error("Couldn't generate view types!");
                return;
            }
            (0, commandUtils_1.writeStringToFileOrPrintToConsole)(jsxIntrinsicViewFileContent, realOutputPath);
        };
        (0, commandUtils_1.runCommandOnWatch)(parsedArgs, command);
    });
}
//# sourceMappingURL=generateJSXIntrinsicsCommand.js.map