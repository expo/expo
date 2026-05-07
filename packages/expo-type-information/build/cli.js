"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const commandUtils_1 = require("./commands/commandUtils");
const generateConciseTSCommand_1 = require("./commands/generateConciseTSCommand");
const generateMocksForFileCommand_1 = require("./commands/generateMocksForFileCommand");
const generateTypeFilesCommand_1 = require("./commands/generateTypeFilesCommand");
const generateInlineModulesTypesCommand_1 = require("./commands/generateInlineModulesTypesCommand");
const typeInformationCommand_1 = require("./commands/typeInformationCommand");
const generateModuleTypesCommand_1 = require("./commands/generateModuleTypesCommand");
const generateViewTypesCommand_1 = require("./commands/generateViewTypesCommand");
const generateJSXIntrinsicsCommand_1 = require("./commands/generateJSXIntrinsicsCommand");
async function main(args) {
    if (!(0, commandUtils_1.isSourceKittenInstalled)()) {
        console.error('Sourcekitten not found! Install it like so: brew install sourcekitten');
        return;
    }
    const cli = new commander_1.Command();
    cli
        .name('expo-type-information')
        .version(require('../package.json').version)
        .description('CLI commands for retrieving type information from native files.');
    (0, generateConciseTSCommand_1.generateConciseExpoModuleTSInterfaceCommand)(cli);
    (0, generateMocksForFileCommand_1.generateMocksForFileCommand)(cli);
    (0, generateTypeFilesCommand_1.generateTypeFilesCommand)(cli);
    (0, generateInlineModulesTypesCommand_1.generateInlineModulesTypesCommand)(cli);
    const otherCommands = cli.command('other').description('internal or very specific commands');
    (0, typeInformationCommand_1.typeInformationCommand)(otherCommands);
    (0, generateModuleTypesCommand_1.generateModuleTypesCommand)(otherCommands);
    (0, generateViewTypesCommand_1.generateViewTypesCommand)(otherCommands);
    (0, generateJSXIntrinsicsCommand_1.generateJsxIntrinsics)(otherCommands);
    await cli.parseAsync(args, { from: 'user' });
}
main(process.argv.slice(2));
//# sourceMappingURL=cli.js.map