"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findGitHubEmail = exports.findMyName = void 0;
const cross_spawn_1 = __importDefault(require("cross-spawn"));
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
//# sourceMappingURL=git.js.map