"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const commandUtils_1 = require("./commands/commandUtils");
const generateJSXIntrinsicsCommand_1 = require("./commands/generateJSXIntrinsicsCommand");
const generateMocksForFileCommand_1 = require("./commands/generateMocksForFileCommand");
const generateModuleTypesCommand_1 = require("./commands/generateModuleTypesCommand");
const generateViewTypesCommand_1 = require("./commands/generateViewTypesCommand");
const inlineModulesInterfaceCommand_1 = require("./commands/inlineModulesInterfaceCommand");
const moduleInterfaceCommand_1 = require("./commands/moduleInterfaceCommand");
const shortModuleInterfaceCommand_1 = require("./commands/shortModuleInterfaceCommand");
const typeInformationCommand_1 = require("./commands/typeInformationCommand");
async function main(args) {
    if (!(0, commandUtils_1.isSourceKittenInstalled)()) {
        console.error('Sourcekitten not found! Install it like so: brew install sourcekitten');
        return;
    }
    const cli = new commander_1.Command();
    cli
        .name('expo-type-information')
        .version(require('../package.json').version)
        .description('Retrieve type information from Swift Expo modules to generate TypeScript.');
    (0, moduleInterfaceCommand_1.moduleInterfaceCommand)(cli);
    (0, inlineModulesInterfaceCommand_1.inlineModulesInterfaceCommand)(cli);
    (0, shortModuleInterfaceCommand_1.shortModuleInterfaceCommand)(cli);
    (0, generateMocksForFileCommand_1.generateMocksForFileCommand)(cli);
    const otherCommands = cli.command('other').description('internal or very specific commands');
    (0, typeInformationCommand_1.typeInformationCommand)(otherCommands);
    (0, generateModuleTypesCommand_1.generateModuleTypesCommand)(otherCommands);
    (0, generateViewTypesCommand_1.generateViewTypesCommand)(otherCommands);
    (0, generateJSXIntrinsicsCommand_1.generateJsxIntrinsics)(otherCommands);
    await cli.parseAsync(args, { from: 'user' });
}
main(process.argv.slice(2));
//# sourceMappingURL=cli.js.map