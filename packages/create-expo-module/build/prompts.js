"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
const utils_1 = require("./utils");
async function getPrompts(targetDir) {
    const targetBasename = path_1.default.basename(targetDir);
    return [
        {
            type: 'text',
            name: 'slug',
            message: 'What is the name of the npm package?',
            initial: (0, validate_npm_package_name_1.default)(targetBasename).validForNewPackages ? targetBasename : undefined,
            validate: (input) => (0, validate_npm_package_name_1.default)(input).validForNewPackages || 'Must be a valid npm package name',
        },
        {
            type: 'text',
            name: 'name',
            message: 'What is the project name?',
            initial: (_, answers) => {
                return answers.slug
                    .replace(/^./, (match) => match.toUpperCase())
                    .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());
            },
        },
        {
            type: 'text',
            name: 'description',
            message: 'How would you describe the module?',
            initial: 'My new module',
            validate: (input) => !!input || 'Cannot be empty',
        },
        {
            type: 'text',
            name: 'package',
            message: 'What is the Android package name?',
            initial: (_, answers) => {
                const namespace = answers.slug
                    .replace(/\W/g, '')
                    .replace(/^(expo|reactnative)/, '')
                    .toLowerCase();
                return `expo.modules.${namespace}`;
            },
        },
        {
            type: 'text',
            name: 'authorName',
            message: 'What is the name of the package author?',
            initial: await (0, utils_1.findMyName)(),
            validate: (input) => !!input || 'Cannot be empty',
        },
        {
            type: 'text',
            name: 'authorEmail',
            message: 'What is the email address of the author?',
            initial: await (0, utils_1.findGitHubEmail)(),
        },
        {
            type: 'text',
            name: 'authorUrl',
            message: "What is the URL to the author's GitHub profile?",
            initial: async (_, answers) => await (0, utils_1.findGitHubProfileUrl)(answers.authorEmail),
        },
        {
            type: 'text',
            name: 'repo',
            message: 'What is the URL for the repository?',
            initial: async (_, answers) => await (0, utils_1.guessRepoUrl)(answers.authorUrl, answers.slug),
            validate: (input) => /^https?:\/\//.test(input) || 'Must be a valid URL',
        },
    ];
}
exports.default = getPrompts;
//# sourceMappingURL=prompts.js.map