"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleInterfaceCommand = moduleInterfaceCommand;
const path_1 = __importDefault(require("path"));
const commandUtils_1 = require("./commandUtils");
const typescriptGeneration_1 = require("../typescriptGeneration");
function moduleInterfaceCommand(cli) {
    return (0, commandUtils_1.addCommonOptions)(cli.command('module-interface'))
        .summary('Generates a full ts interface for a Swift module.')
        .description('Generates a full ts interface for a Swift module. It consists of types.ts file with all types defined in the module, module.ts with the native module definition, and view.tsx for each view defined in the module, and an index.ts file which reexports some functions.')
        .action(async (options) => {
        const parsedArgs = await (0, commandUtils_1.parseCommandArguments)(options, false);
        if (!parsedArgs) {
            return;
        }
        const { realInputPaths, realOutputPath } = parsedArgs;
        const command = async () => {
            const typeInfo = await (0, commandUtils_1.getFileTypeInformationFromArgs)(parsedArgs);
            if (!typeInfo) {
                return;
            }
            const generatedFiles = await (0, typescriptGeneration_1.generateFullTsInterface)(typeInfo);
            if (!generatedFiles) {
                return;
            }
            const { moduleTypesFile, moduleViewsFiles, moduleNativeFile, indexFile } = generatedFiles;
            const dirName = realOutputPath ?? path_1.default.dirname(realInputPaths[0]);
            const writeFilePromises = [];
            for (const outputFile of [
                moduleTypesFile,
                ...moduleViewsFiles,
                moduleNativeFile,
                indexFile,
            ]) {
                const outputFilePath = path_1.default.resolve(dirName, outputFile.name);
                writeFilePromises.push((0, commandUtils_1.writeToStableFile)({ filePath: outputFilePath, content: outputFile.content }));
            }
            await Promise.all(writeFilePromises);
        };
        (0, commandUtils_1.runCommandOnWatch)(parsedArgs, command);
    });
}
//# sourceMappingURL=moduleInterfaceCommand.js.map