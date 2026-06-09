"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortModuleInterfaceCommand = shortModuleInterfaceCommand;
const commandUtils_1 = require("./commandUtils");
function shortModuleInterfaceCommand(cli) {
    (0, commandUtils_1.addCommonOptions)(cli
        .command('short-module-interface')
        .summary('create a short TypeScript interface, great with inline-modules')
        .description('Creates a short TypeScript interface for an Expo module. Overwrites **ModuleName.generated.ts** and creates **ModuleName.ts** if not present. Can be used with inline-modules.')).action(async (options) => {
        const parsedArgs = await (0, commandUtils_1.parseCommandArguments)(options, false);
        if (!parsedArgs)
            return;
        const command = () => (0, commandUtils_1.generateConciseTsFiles)(parsedArgs);
        (0, commandUtils_1.runCommandOnWatch)(parsedArgs, command);
    });
}
//# sourceMappingURL=shortModuleInterfaceCommand.js.map