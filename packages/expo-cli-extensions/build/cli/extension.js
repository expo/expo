"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cliExtension = cliExtension;
const chalk_1 = __importDefault(require("chalk"));
const parameters_1 = require("./parameters");
/**
 * Executes an Expo CLI extension command with the provided executor function.
 * This function retrieves the command, arguments, and connected applications,
 * then calls the executor with these parameters.
 *
 * @param executor - A function that takes a command, arguments, and connected applications,
 *                   and returns a Promise that resolves when the command execution is complete.
 */
async function cliExtension(executor) {
    const { apps, args, command } = (0, parameters_1.getExpoCliPluginParameters)(process.argv);
    try {
        const results = await executor(command, args, apps);
        if (results) {
            console.log(JSON.stringify(results, null, 2));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
}
//# sourceMappingURL=extension.js.map