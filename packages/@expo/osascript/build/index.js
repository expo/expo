/**
 * Utilities for working with `osascript` which runs AppleScript on Macs
 */
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnAsync = exports.safeIdOfAppAsync = exports.openTerminalToSpecificFolderAsync = exports.openItermToSpecificFolderAsync = exports.openInEditorAsync = exports.openInAppAsync = exports.openFolderInTerminalAppAsync = exports.openFinderToFolderAsync = exports.isAppRunningAsync = exports.execAsync = exports.chooseTerminalAppAsync = exports.chooseEditorAppAsync = exports.chooseAppAsync = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const exec_async_1 = __importDefault(require("exec-async"));
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
function osascriptArgs(script) {
    if (!util_1.default.isArray(script)) {
        script = [script];
    }
    const args = [];
    for (const line of script) {
        args.push('-e');
        args.push(line);
    }
    return args;
}
async function osascriptExecAsync(script, opts) {
    return await (0, exec_async_1.default)('osascript', osascriptArgs(script), Object.assign({ stdio: 'inherit' }, opts));
}
exports.execAsync = osascriptExecAsync;
async function osascriptSpawnAsync(script, opts) {
    return await (0, spawn_async_1.default)('osascript', osascriptArgs(script), opts);
}
exports.spawnAsync = osascriptSpawnAsync;
async function isAppRunningAsync(appName) {
    const zeroMeansNo = (await osascriptExecAsync('tell app "System Events" to count processes whose name is ' + JSON.stringify(appName))).trim();
    return zeroMeansNo !== '0';
}
exports.isAppRunningAsync = isAppRunningAsync;
async function safeIdOfAppAsync(appName) {
    try {
        return (await osascriptExecAsync('id of app ' + JSON.stringify(appName))).trim();
    }
    catch {
        return null;
    }
}
exports.safeIdOfAppAsync = safeIdOfAppAsync;
async function openFinderToFolderAsync(dir, activate = true) {
    await osascriptSpawnAsync([
        'tell application "Finder"',
        'open POSIX file ' + JSON.stringify(dir),
        (activate && 'activate') || '',
        'end tell',
    ]);
}
exports.openFinderToFolderAsync = openFinderToFolderAsync;
async function openInAppAsync(appName, pth) {
    const cmd = 'tell app ' + JSON.stringify(appName) + ' to open ' + JSON.stringify(path_1.default.resolve(pth));
    // console.log("cmd=", cmd);
    return await osascriptSpawnAsync(cmd);
}
exports.openInAppAsync = openInAppAsync;
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
            return listOfAppNames[i];
        }
    }
    for (i = 0; i < listOfAppNames.length; i++) {
        if (appIds[i]) {
            return listOfAppNames[i];
        }
    }
    return null;
}
exports.chooseAppAsync = chooseAppAsync;
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
exports.chooseEditorAppAsync = chooseEditorAppAsync;
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
exports.chooseTerminalAppAsync = chooseTerminalAppAsync;
async function openInEditorAsync(pth, preferredEditor) {
    const appName = await chooseEditorAppAsync(preferredEditor);
    if (!appName) {
        throw new Error('No editor found.');
    }
    console.log('Will open in ' + appName + ' -- ' + pth);
    return await openInAppAsync(appName, pth);
}
exports.openInEditorAsync = openInEditorAsync;
async function openItermToSpecificFolderAsync(dir) {
    return await osascriptSpawnAsync([
        'tell application "iTerm"',
        'make new terminal',
        'tell the first terminal',
        'activate current session',
        'launch session "Default Session"',
        'tell the last session',
        'write text "cd ' + util_1.default.inspect(dir) + ' && clear"',
        // 'write text "clear"',
        'end tell',
        'end tell',
        'end tell',
    ]);
    // exec("osascript -e 'tell application \"iTerm\"' -e 'make new terminal' -e 'tell the first terminal' -e 'activate current session' -e 'launch session \"Default Session\"' -e 'tell the last session' -e 'write text \"cd #{value}\"' -e 'write text \"clear\"' -e 'end tell' -e 'end tell' -e 'end tell' > /dev/null 2>&1")
}
exports.openItermToSpecificFolderAsync = openItermToSpecificFolderAsync;
async function openTerminalToSpecificFolderAsync(dir, inTab = false) {
    if (inTab) {
        return await osascriptSpawnAsync([
            'tell application "terminal"',
            'tell application "System Events" to tell process "terminal" to keystroke "t" using command down',
            'do script with command "cd ' +
                util_1.default.inspect(dir) +
                ' && clear" in selected tab of the front window',
            'end tell',
        ]);
    }
    else {
        return await osascriptSpawnAsync([
            'tell application "terminal"',
            'do script "cd ' + util_1.default.inspect(dir) + ' && clear"',
            'end tell',
            'tell application "terminal" to activate',
        ]);
    }
}
exports.openTerminalToSpecificFolderAsync = openTerminalToSpecificFolderAsync;
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
exports.openFolderInTerminalAppAsync = openFolderInTerminalAppAsync;
//# sourceMappingURL=index.js.map