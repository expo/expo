"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRunCommand = exports.resolvePackageManager = void 0;
const child_process_1 = require("child_process");
/** Determine which package manager to use for installing dependencies based on how the process was started. */
function resolvePackageManager() {
    // Attempt to detect if the user started the command using `yarn` or `pnpm`
    const userAgent = process.env.npm_config_user_agent;
    if (userAgent?.startsWith('yarn')) {
        return 'yarn';
    }
    else if (userAgent?.startsWith('pnpm')) {
        return 'pnpm';
    }
    else if (userAgent?.startsWith('npm')) {
        return 'npm';
    }
    else if (userAgent?.startsWith('bun')) {
        return 'bun';
    }
    // Try availability
    if (isPackageManagerAvailable('yarn')) {
        return 'yarn';
    }
    else if (isPackageManagerAvailable('pnpm')) {
        return 'pnpm';
    }
    else if (isPackageManagerAvailable('bun')) {
        return 'bun';
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
function formatRunCommand(manager, cmd) {
    switch (manager) {
        case 'pnpm':
            return `pnpm run ${cmd}`;
        case 'yarn':
            return `yarn ${cmd}`;
        case 'bun':
            return `bun run ${cmd}`;
        case 'npm':
        default:
            return `npm run ${cmd}`;
    }
}
exports.formatRunCommand = formatRunCommand;
//# sourceMappingURL=resolvePackageManager.js.map