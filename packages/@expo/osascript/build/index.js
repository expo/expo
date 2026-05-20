"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseAppAsync = chooseAppAsync;
exports.chooseEditorAppAsync = chooseEditorAppAsync;
exports.chooseTerminalAppAsync = chooseTerminalAppAsync;
exports.escapeString = escapeString;
exports.execAsync = osascriptExecAsync;
exports.isAppRunningAsync = isAppRunningAsync;
exports.openFinderToFolderAsync = openFinderToFolderAsync;
exports.openFolderInTerminalAppAsync = openFolderInTerminalAppAsync;
exports.openInAppAsync = openInAppAsync;
exports.openInEditorAsync = openInEditorAsync;
exports.openItermToSpecificFolderAsync = openItermToSpecificFolderAsync;
exports.openTerminalToSpecificFolderAsync = openTerminalToSpecificFolderAsync;
exports.safeIdOfAppAsync = safeIdOfAppAsync;
exports.spawnAsync = osascriptSpawnAsync;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const path_1 = __importDefault(require("path"));
function escapeString(value) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t');
}
function shellQuote(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
function osascriptArgs(script) {
    if (!Array.isArray(script)) {
        script = [script];
    }
    const args = [];
    for (const line of script) {
        args.push('-e');
        args.push(line);
    }
    return args;
}
async function osascriptSpawnAsync(script, opts) {
    return await (0, spawn_async_1.default)('osascript', osascriptArgs(script), opts);
}
async function isAppRunningAsync(appName) {
    const { stdout } = await osascriptSpawnAsync(`tell app "System Events" to count processes whose name is "${escapeString(appName)}"`);
    return stdout.trim() !== '0';
}
async function safeIdOfAppAsync(appName) {
    try {
        const { stdout } = await osascriptSpawnAsync(`id of app "${escapeString(appName)}"`);
        return stdout.trim();
    }
    catch {
        return null;
    }
}
async function openFinderToFolderAsync(dir, activate = true) {
    await osascriptSpawnAsync([
        'tell application "Finder"',
        `open POSIX file "${escapeString(dir)}"`,
        (activate && 'activate') || '',
        'end tell',
    ]);
}
async function openInAppAsync(appName, pth) {
    return await osascriptSpawnAsync(`tell app "${escapeString(appName)}" to open "${escapeString(path_1.default.resolve(pth))}"`);
}
async function chooseAppAsync(listOfAppNames) {
    const runningAwaitables = [];
    const appIdAwaitables = [];
    for (const appName of listOfAppNames) {
        runningAwaitables.push(isAppRunningAsync(appName));
        appIdAwaitables.push(safeIdOfAppAsync(appName));
    }
    const running = await Promise.all(runningAwaitables);
    const appIds = await Promise.all(appIdAwaitables);
    let i;
    for (i = 0; i < listOfAppNames.length; i++) {
        if (running[i]) {
            const appName = listOfAppNames[i];
            if (appName != null) {
                return appName;
            }
        }
    }
    for (i = 0; i < listOfAppNames.length; i++) {
        if (appIds[i]) {
            const appName = listOfAppNames[i];
            if (appName != null) {
                return appName;
            }
        }
    }
    return null;
}
async function chooseEditorAppAsync(preferredEditor) {
    if (preferredEditor) {
        // Make sure this editor exists
        const appId = await safeIdOfAppAsync(preferredEditor);
        if (appId) {
            return preferredEditor;
        }
        else {
            console.warn(`Your preferred editor (${preferredEditor}) isn't installed on this computer.`);
        }
    }
    const editorsToTry = [
        'Visual Studio Code',
        'Atom',
        'Sublime Text',
        'TextMate',
        'TextWrangler',
        'Visual Studio Code',
        'Brackets',
        'SubEthaEdit',
        'BBEdit',
        'Textastic',
        'UltraEdit',
        'MacVim',
        'CodeRunner 2',
        'CodeRunner',
        'TextEdit',
    ];
    return await chooseAppAsync(editorsToTry);
}
async function chooseTerminalAppAsync() {
    return await chooseAppAsync([
        'iTerm 3',
        'iTerm 2',
        'iTerm',
        'HyperTerm',
        // 'Cathode',
        // 'Terminator',
        // 'MacTerm',
        'Terminal',
    ]);
}
async function openInEditorAsync(pth, preferredEditor) {
    const appName = await chooseEditorAppAsync(preferredEditor);
    if (!appName) {
        throw new Error('No editor found.');
    }
    console.log('Will open in ' + appName + ' -- ' + pth);
    return await openInAppAsync(appName, pth);
}
async function openItermToSpecificFolderAsync(dir) {
    const shellCommand = escapeString(`cd ${shellQuote(dir)} && clear`);
    return await osascriptSpawnAsync([
        'tell application "iTerm"',
        'make new terminal',
        'tell the first terminal',
        'activate current session',
        'launch session "Default Session"',
        'tell the last session',
        `write text "${shellCommand}"`,
        'end tell',
        'end tell',
        'end tell',
    ]);
}
async function openTerminalToSpecificFolderAsync(dir, inTab = false) {
    const shellCommand = escapeString(`cd ${shellQuote(dir)} && clear`);
    if (inTab) {
        return await osascriptSpawnAsync([
            'tell application "terminal"',
            'tell application "System Events" to tell process "terminal" to keystroke "t" using command down',
            `do script with command "${shellCommand}" in selected tab of the front window`,
            'end tell',
        ]);
    }
    else {
        return await osascriptSpawnAsync([
            'tell application "terminal"',
            `do script "${shellCommand}"`,
            'end tell',
            'tell application "terminal" to activate',
        ]);
    }
}
async function openFolderInTerminalAppAsync(dir, inTab = false) {
    const program = await chooseTerminalAppAsync();
    switch (program) {
        case 'iTerm':
            return await openItermToSpecificFolderAsync(dir);
        case 'Terminal':
        default:
            return await openTerminalToSpecificFolderAsync(dir, inTab);
    }
}
/** @deprecated */
async function osascriptExecAsync(script, opts) {
    return (await osascriptSpawnAsync(script, opts)).stdout.trim();
}
//# sourceMappingURL=index.js.map