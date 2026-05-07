"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateConciseExpoModuleTSInterfaceCommand = generateConciseExpoModuleTSInterfaceCommand;
const commandUtils_1 = require("./commandUtils");
function generateConciseExpoModuleTSInterfaceCommand(cli) {
    (0, commandUtils_1.addCommonOptions)(cli
        .command('generate-concise-ts')
        .summary('Creates concise ts interface, great with inline-modules.')
        .description('Creates concise ts interface for an expo module. Overrites `ModuleName.generated.ts` and creates `ModuleName.ts` if not present. Can be used with inline-modules.')).action(async (options) => {
        const parsedArgs = await (0, commandUtils_1.parseCommandArguments)(options, false);
        if (!parsedArgs)
            return;
        const command = () => (0, commandUtils_1.generateConciseTsFiles)(parsedArgs);
        (0, commandUtils_1.runCommandOnWatch)(parsedArgs, command);
    });
}
//# sourceMappingURL=generateConciseTSCommand.js.map