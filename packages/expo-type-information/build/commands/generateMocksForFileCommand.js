"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMocksForFileCommand = generateMocksForFileCommand;
const commandUtils_1 = require("./commandUtils");
const mockgen_1 = require("../mockgen");
function generateMocksForFileCommand(cli) {
    return (0, commandUtils_1.addCommonOptions)(cli.command('generate-mocks-for-file')).action(async (options) => {
        const parsedArgs = await (0, commandUtils_1.parseCommandArguments)(options);
        if (!parsedArgs) {
            return;
        }
        const command = async () => {
            const typeInfo = await (0, commandUtils_1.getFileTypeInformationFromArgs)(parsedArgs);
            if (!typeInfo) {
                return;
            }
            (0, mockgen_1.generateMocks)([typeInfo], 'typescript');
        };
        (0, commandUtils_1.runCommandOnWatch)(parsedArgs, command);
    });
}
//# sourceMappingURL=generateMocksForFileCommand.js.map