"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const TemplateProject_1 = __importDefault(require("../TemplateProject"));
const registerCommand_1 = require("../registerCommand");
async function createProjectAsync(config, options) {
    const app = config.applications[options.app];
    if (app.preset === 'detox') {
        console.log(`Using ${chalk_1.default.green('detox')} preset.`);
        const preset = new TemplateProject_1.default(app, options.app, options.platform, options.configFile);
        console.log(`Creating test app in ${chalk_1.default.green(options.path)}.`);
        await preset.createApplicationAsync(options.path);
    }
    else {
        throw new Error(`Unknown preset: ${app.preset}`);
    }
}
exports.default = (program) => {
    (0, registerCommand_1.registerCommand)(program, 'create-project', createProjectAsync).option('-a, --app [string]', 'Name of the application to create.');
};
//# sourceMappingURL=CreateProject.js.map