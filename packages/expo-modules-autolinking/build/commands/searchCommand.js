"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const autolinkingOptions_1 = require("./autolinkingOptions");
const findModules_1 = require("../autolinking/findModules");
function searchCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('search [searchPaths...]'))
        .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
        .action(async (searchPaths, commandArguments) => {
        const platform = commandArguments.platform ?? 'apple';
        const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)({
            ...commandArguments,
            searchPaths,
        });
        const expoModulesSearchResults = await (0, findModules_1.findModulesAsync)({
            autolinkingOptions: await autolinkingOptionsLoader.getPlatformOptions(platform),
            appRoot: await autolinkingOptionsLoader.getAppRoot(),
        });
        if (commandArguments.json) {
            console.log(JSON.stringify(expoModulesSearchResults));
        }
        else {
            console.log(require('util').inspect(expoModulesSearchResults, false, null, true));
        }
    });
}
//# sourceMappingURL=searchCommand.js.map