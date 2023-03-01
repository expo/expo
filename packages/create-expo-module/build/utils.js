"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPackageJson = exports.guessRepoUrl = exports.findGitHubProfileUrl = exports.findGitHubEmail = exports.findMyName = exports.newStep = void 0;
const chalk_1 = __importDefault(require("chalk"));
const cross_spawn_1 = __importDefault(require("cross-spawn"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const github_username_1 = __importDefault(require("github-username"));
const ora_1 = __importDefault(require("ora"));
const path_1 = __importDefault(require("path"));
async function newStep(title, action, options = {}) {
    const disabled = process.env.CI || process.env.EXPO_DEBUG;
    const step = (0, ora_1.default)({
        text: chalk_1.default.bold(title),
        isEnabled: !disabled,
        stream: disabled ? process.stdout : process.stderr,
        ...options,
    });
    step.start();
    try {
        return await action(step);
    }
    catch (error) {
        step.fail();
        console.error(error);
        process.exit(1);
    }
}
exports.newStep = newStep;
/**
 * Finds user's name by reading it from the git config.
 */
async function findMyName() {
    try {
        return cross_spawn_1.default.sync('git', ['config', '--get', 'user.name']).stdout.toString().trim();
    }
    catch {
        return '';
    }
}
exports.findMyName = findMyName;
/**
 * Finds user's email by reading it from the git config.
 */
async function findGitHubEmail() {
    try {
        return cross_spawn_1.default.sync('git', ['config', '--get', 'user.email']).stdout.toString().trim();
    }
    catch {
        return '';
    }
}
exports.findGitHubEmail = findGitHubEmail;
/**
 * Get the GitHub username from an email address if the email can be found in any commits on GitHub.
 */
async function findGitHubProfileUrl(email) {
    try {
        const username = (await (0, github_username_1.default)(email)) ?? '';
        return `https://github.com/${username}`;
    }
    catch {
        return '';
    }
}
exports.findGitHubProfileUrl = findGitHubProfileUrl;
/**
 * Guesses the repository URL based on the author profile URL and the package slug.
 */
async function guessRepoUrl(authorUrl, slug) {
    if (/^https?:\/\/github.com\/[^/]+/.test(authorUrl)) {
        const normalizedSlug = slug.replace(/^@/, '').replace(/\//g, '-');
        return `${authorUrl}/${normalizedSlug}`;
    }
    return '';
}
exports.guessRepoUrl = guessRepoUrl;
function findPackageJson(startDir) {
    let dir = path_1.default.resolve(startDir || process.cwd());
    do {
        const pkgfile = path_1.default.join(dir, 'package.json');
        if (!fs_extra_1.default.existsSync(pkgfile)) {
            dir = path_1.default.join(dir, '..');
            continue;
        }
        return pkgfile;
    } while (dir !== path_1.default.resolve(dir, '..'));
    return null;
}
exports.findPackageJson = findPackageJson;
//# sourceMappingURL=utils.js.map