"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
/**
 * Lightweight version of @expo/spawn-async. Returns a promise that is fulfilled with the output of
 * stdout, or rejected with the error event object (or the output of stderr).
 */
async function spawnAsync(command, args = [], options = {}) {
    const promise = new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(command, args, options);
        let stdout = '';
        let stderr = '';
        if (child.stdout) {
            child.stdout.on('data', (data) => {
                stdout += data;
            });
        }
        if (child.stderr) {
            child.stderr.on('data', (data) => {
                stderr += data;
            });
        }
        const completionListener = (code, signal) => {
            child.removeListener('error', errorListener);
            if (code !== 0) {
                reject(signal
                    ? new Error(`${command} exited with signal: ${signal}\n${stderr}`)
                    : new Error(`${command} exited with non-zero code: ${code}\n${stderr}`));
            }
            else {
                resolve(stdout);
            }
        };
        let errorListener = (error) => {
            child.removeListener('close', completionListener);
            reject(error);
        };
        child.once('close', completionListener);
        child.once('error', errorListener);
    });
    return promise;
}
exports.default = spawnAsync;
//# sourceMappingURL=spawnAsync.js.map