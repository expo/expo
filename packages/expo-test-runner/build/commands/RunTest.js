"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const TemplateProject_1 = __importDefault(require("../TemplateProject"));
const registerCommand_1 = require("../registerCommand");
function findTest(config, test) {
    for (const appName in config.applications) {
        const app = config.applications[appName];
        for (const testName in app.tests) {
            if (test === testName) {
                return [appName, app];
            }
        }
    }
    throw new Error(`Couldn't find test: ${test}`);
}
async function runTestAsync(config, options) {
    const [appName, app] = findTest(config, options.test);
    const test = app.tests[options.test];
    if (app.preset === 'detox') {
        console.log(`Using ${chalk_1.default.green('detox')} preset.`);
        const preset = new TemplateProject_1.default(app, appName, options.platform, options.configFile);
        console.log(`Creating test app in ${chalk_1.default.green(options.path)}.`);
        await preset.createApplicationAsync(options.path);
        console.log(`Building app.`);
        await preset.build(options.path, test);
        console.log(`Running tests.`);
        await preset.run(options.path, test);
        if (options.shouldBeCleaned) {
            console.log(`Cleaning.`);
            await fs.remove(options.path);
        }
    }
    else {
        throw new Error(`Unknown preset: ${app.preset}`);
    }
}
exports.default = (program) => {
    (0, registerCommand_1.registerCommand)(program, 'run-test', runTestAsync).option('-t, --test [string]', 'Name of the test case to run.');
};
//# sourceMappingURL=RunTest.js.map