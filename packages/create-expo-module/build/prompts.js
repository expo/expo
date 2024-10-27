"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalSubstitutionDataPrompts = exports.getSubstitutionDataPrompts = exports.getLocalFolderNamePrompt = exports.getSlugPrompt = void 0;
const path_1 = __importDefault(require("path"));
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
const git_1 = require("./utils/git");
const github_1 = require("./utils/github");
function getInitialName(customTargetPath) {
    const targetBasename = customTargetPath && path_1.default.basename(customTargetPath);
    return targetBasename && (0, validate_npm_package_name_1.default)(targetBasename).validForNewPackages
        ? targetBasename
        : 'my-module';
}
function getSlugPrompt(customTargetPath) {
    const initial = getInitialName(customTargetPath);
    return {
        type: 'text',
        name: 'slug',
        message: 'What is the name of the npm package?',
        initial,
        validate: (input) => (0, validate_npm_package_name_1.default)(input).validForNewPackages || 'Must be a valid npm package name',
    };
}
exports.getSlugPrompt = getSlugPrompt;
function getLocalFolderNamePrompt(customTargetPath) {
    const initial = getInitialName(customTargetPath);
    return {
        type: 'text',
        name: 'slug',
        message: 'What is the name of the local module?',
        initial,
        validate: (input) => (0, validate_npm_package_name_1.default)(input).validForNewPackages || 'Must be a valid npm package name',
    };
}
exports.getLocalFolderNamePrompt = getLocalFolderNamePrompt;
async function getSubstitutionDataPrompts(slug) {
    return [
        {
            type: 'text',
            name: 'name',
            message: 'What is the native module name?',
            initial: () => {
                return slug
                    .replace(/^@/, '')
                    .replace(/^./, (match) => match.toUpperCase())
                    .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());
            },
            validate: (input) => !!input || 'The native module name cannot be empty',
        },
        {
            type: 'text',
            name: 'description',
            message: 'How would you describe the module?',
            initial: 'My new module',
            validate: (input) => !!input || 'The description cannot be empty',
        },
        {
            type: 'text',
            name: 'package',
            message: 'What is the Android package name?',
            initial: () => {
                const namespace = slug
                    .replace(/\W/g, '')
                    .replace(/^(expo|reactnative)/, '')
                    .toLowerCase();
                return `expo.modules.${namespace}`;
            },
            validate: (input) => !!input || 'The Android package name cannot be empty',
        },
        {
            type: 'text',
            name: 'authorName',
            message: 'What is the name of the package author?',
            initial: await (0, git_1.findMyName)(),
            validate: (input) => !!input || 'Cannot be empty',
        },
        {
            type: 'text',
            name: 'authorEmail',
            message: 'What is the email address of the author?',
            initial: await (0, git_1.findGitHubEmail)(),
        },
        {
            type: 'text',
            name: 'authorUrl',
            message: "What is the URL to the author's GitHub profile?",
            initial: async (_, answers) => await (0, github_1.findGitHubUserFromEmail)(answers.authorEmail).then((actor) => actor || ''),
        },
        {
            type: 'text',
            name: 'repo',
            message: 'What is the URL for the repository?',
            initial: async (_, answers) => await (0, github_1.guessRepoUrl)(answers.authorUrl, slug),
            validate: (input) => /^https?:\/\//.test(input) || 'Must be a valid URL',
        },
    ];
}
exports.getSubstitutionDataPrompts = getSubstitutionDataPrompts;
async function getLocalSubstitutionDataPrompts(slug) {
    return [
        {
            type: 'text',
            name: 'name',
            message: 'What is the native module name?',
            initial: () => {
                return slug
                    .replace(/^@/, '')
                    .replace(/^./, (match) => match.toUpperCase())
                    .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());
            },
            validate: (input) => !!input || 'The native module name cannot be empty',
        },
        {
            type: 'text',
            name: 'package',
            message: 'What is the Android package name?',
            initial: () => {
                const namespace = slug
                    .replace(/\W/g, '')
                    .replace(/^(expo|reactnative)/, '')
                    .toLowerCase();
                return `expo.modules.${namespace}`;
            },
            validate: (input) => !!input || 'The Android package name cannot be empty',
        },
    ];
}
exports.getLocalSubstitutionDataPrompts = getLocalSubstitutionDataPrompts;
//# sourceMappingURL=prompts.js.map