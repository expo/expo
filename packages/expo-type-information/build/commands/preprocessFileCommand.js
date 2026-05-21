"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preprocessFileCommand = preprocessFileCommand;
const fs_1 = __importDefault(require("fs"));
const commandUtils_1 = require("./commandUtils");
const typeInformation_1 = require("../typeInformation");
function preprocessFileCommand(cli) {
    return (0, commandUtils_1.addCommonOptions)(cli.command('preprocess-file'))
        .description('Print the preprocessed file(s) in the state right before parsing them using `sourcekitten`. It helps with checking how the `--module-path`, `--input-path`, and `--type-inference` options affect the parsed file.')
        .summary('Print the preprocessed file(s) in the state right before parsing them using `sourcekitten`.')
        .action(async (options) => {
        const parsedArgs = await (0, commandUtils_1.parseCommandArguments)(options);
        if (!parsedArgs) {
            return;
        }
        const { realInputPaths, typeInference } = parsedArgs;
        const command = async () => {
            (0, typeInformation_1.withPreparedSingleFile)({
                input: { type: 'file', inputFileAbsolutePaths: realInputPaths },
                typeInference,
            }, async (filePath) => {
                console.log(await fs_1.default.promises.readFile(filePath, 'utf-8'));
            });
        };
        (0, commandUtils_1.runCommandOnWatch)(parsedArgs, command);
    });
}
//# sourceMappingURL=preprocessFileCommand.js.map