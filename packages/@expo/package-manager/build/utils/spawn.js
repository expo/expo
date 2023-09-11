"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnSudoAsync = exports.createPendingSpawnAsync = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const sudo_prompt_1 = __importDefault(require("sudo-prompt"));
function createPendingSpawnAsync(actionAsync, spawnAsync) {
    // Manually rsolve the child promise whenever the prepending async action is resolved.
    // Avoid `childReject` to prevent "unhandled promise rejection" for one of the two promises.
    let childResolve;
    const child = new Promise((resolve, reject) => {
        childResolve = resolve;
    });
    const pendingPromise = new Promise((spawnResolve, spawnReject) => {
        actionAsync()
            .then((result) => {
            const spawnPromise = spawnAsync(result);
            childResolve(spawnPromise.child);
            spawnPromise.then(spawnResolve).catch(spawnReject);
        })
            .catch((error) => {
            childResolve(null);
            spawnReject(error);
        });
    });
    pendingPromise.child = child;
    return pendingPromise;
}
exports.createPendingSpawnAsync = createPendingSpawnAsync;
/**
 * Spawn a command with sudo privileges.
 * On windows, this uses the `sudo-prompt` package.
 * on other systems, this uses the `sudo` binary.
 */
async function spawnSudoAsync(command, spawnOptions) {
    // sudo prompt only seems to work on win32 machines.
    if (process.platform === 'win32') {
        return new Promise((resolve, reject) => {
            sudo_prompt_1.default.exec(command.join(' '), { name: 'pod install' }, (error) => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        });
    }
    else {
        // Attempt to use sudo to run the command on Mac and Linux.
        // TODO(Bacon): Make a v of sudo-prompt that's win32 only for better bundle size.
        console.log('Your password might be needed to install CocoaPods CLI: https://guides.cocoapods.org/using/getting-started.html#installation');
        await (0, spawn_async_1.default)('sudo', command, spawnOptions);
    }
}
exports.spawnSudoAsync = spawnSudoAsync;
//# sourceMappingURL=spawn.js.map