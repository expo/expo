"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortModuleInterfaceCommand = shortModuleInterfaceCommand;
const commandUtils_1 = require("./commandUtils");
function shortModuleInterfaceCommand(cli) {
    (0, commandUtils_1.addCommonOptions)(cli
        .command('short-module-interface')
        .summary('Creates a short ts interface, great with inline-modules.')
        .description('Creates a short ts interface for an expo module. Overrites `ModuleName.generated.ts` and creates `ModuleName.ts` if not present. Can be used with inline-modules.')).action(async (options) => {
        const parsedArgs = await (0, commandUtils_1.parseCommandArguments)(options, false);
        if (!parsedArgs)
            return;
        const command = () => (0, commandUtils_1.generateConciseTsFiles)(parsedArgs);
        (0, commandUtils_1.runCommandOnWatch)(parsedArgs, command);
    });
}
//# sourceMappingURL=shortModuleInterfaceCommand.js.map