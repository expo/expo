"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const generateModulesProviderCommand_1 = require("./commands/generateModulesProviderCommand");
const reactNativeConfigCommand_1 = require("./commands/reactNativeConfigCommand");
const resolveCommand_1 = require("./commands/resolveCommand");
const searchCommand_1 = require("./commands/searchCommand");
const verifyCommand_1 = require("./commands/verifyCommand");
const memoize_1 = require("./memoize");
async function main(args) {
    const cli = commander_1.default
        .version(require('expo-modules-autolinking/package.json').version)
        .description('CLI command that searches for native modules to autolink them.');
    (0, verifyCommand_1.verifyCommand)(cli);
    (0, searchCommand_1.searchCommand)(cli);
    (0, resolveCommand_1.resolveCommand)(cli);
    (0, generateModulesProviderCommand_1.generateModulesProviderCommand)(cli);
    (0, reactNativeConfigCommand_1.reactNativeConfigCommand)(cli);
    await (0, memoize_1.createMemoizer)().withMemoizer(async () => {
        await cli.parseAsync(args, { from: 'user' });
    });
}
module.exports = main;
//# sourceMappingURL=index.js.map