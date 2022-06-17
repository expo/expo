"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePackageManager = void 0;
const child_process_1 = require("child_process");
/** Determine which package manager to use for installing dependencies based on how the process was started. */
function resolvePackageManager() {
    // Attempt to detect if the user started the command using `yarn` or `pnpm`
    const userAgent = process.env.npm_config_user_agent;
    if (userAgent === null || userAgent === void 0 ? void 0 : userAgent.startsWith('yarn')) {
        return 'yarn';
    }
    else if (userAgent === null || userAgent === void 0 ? void 0 : userAgent.startsWith('pnpm')) {
        return 'pnpm';
    }
    else if (userAgent === null || userAgent === void 0 ? void 0 : userAgent.startsWith('npm')) {
        return 'npm';
    }
    // Try availability
    if (isPackageManagerAvailable('yarn')) {
        return 'yarn';
    }
    else if (isPackageManagerAvailable('pnpm')) {
        return 'pnpm';
    }
    return 'npm';
}
exports.resolvePackageManager = resolvePackageManager;
function isPackageManagerAvailable(manager) {
    try {
        (0, child_process_1.execSync)(`${manager} --version`, { stdio: 'ignore' });
        return true;
    }
    catch { }
    return false;
}
//# sourceMappingURL=resolvePackageManager.js.map