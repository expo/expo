"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const messages_1 = require("./messages");
async function executor(cmd, apps) {
    // Validate command
    cmd = cmd.toLowerCase();
    if (cmd === 'list') {
        try {
            return formatResults(await (0, messages_1.sendMessageAsync)('getRegisteredBackgroundTasks', apps), apps);
        }
        catch (error) {
            throw new Error('An error occured connecting to the app:' + error.toString());
        }
    }
    else if (cmd === 'test') {
        // Trigger background tasks
        try {
            return formatResults(await (0, messages_1.sendMessageAsync)('triggerBackgroundTasks', apps), apps);
        }
        catch (error) {
            throw new Error('An error occured connecting to the app:' + error.toString());
        }
    }
    else {
        return Promise.reject(new Error("Unknown command. Use 'list' to see available tasks or 'trigger' to run a task."));
    }
}
const formatResults = (results, apps) => {
    return results.length > 0
        ? results
            .map((r) => chalk_1.default.bold(apps.find((a) => a.id === r.id).title + ': ') + r.result)
            .join('\n')
        : chalk_1.default.yellow('No apps connected.');
};
async function main() {
    const cmd = process.argv[2];
    const apps = process.argv[3];
    try {
        if (apps.length === 0) {
            throw new Error('No apps connected to the dev server. Please connect an app to use this command.');
        }
        if (!cmd) {
            throw new Error("No command provided. Use 'list' to see available tasks or 'test' to run a task.");
        }
        console.log(await executor(cmd, apps ? JSON.parse(apps) : []));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
main();
