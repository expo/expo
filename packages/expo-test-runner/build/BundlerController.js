"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const node_fetch_1 = __importDefault(require("node-fetch"));
const Utils_1 = require("./Utils");
class BundlerController {
    path;
    process;
    constructor(path) {
        this.path = path;
    }
    async start() {
        const bundler = (0, child_process_1.spawn)('yarn', ['start'], { cwd: this.path, stdio: 'inherit' });
        await (0, Utils_1.delay)(1000);
        this.ensureBundlerWasStarted();
        this.process = bundler;
    }
    async stop() {
        try {
            // Fixes:
            // Error: read EIO
            // at TTY.onStreamRead (node:internal/stream_base_commons:211:20)
            // Emitted 'error' event on ReadStream
            const killProcess = (pid, timeout) => new Promise((resolve, reject) => {
                const signal = 'SIGTERM';
                process.kill(pid, signal);
                let count = 0;
                const interval = setInterval(() => {
                    try {
                        process.kill(pid, 0);
                    }
                    catch {
                        clearInterval(interval);
                        // the process does not exists anymore
                        resolve();
                    }
                    if ((count += 100) > timeout) {
                        clearInterval(interval);
                        reject(new Error('Timeout process kill'));
                    }
                }, 100);
            });
            await killProcess(this.process?.pid, 2000);
        }
        catch (error) {
            console.log(`Cannot kill bundler: ${error}.`);
        }
    }
    async ensureBundlerWasStarted() {
        let retries = 10;
        while (retries-- > 0) {
            try {
                const bundlerStatus = await (0, node_fetch_1.default)('http://localhost:8081/status');
                if (bundlerStatus.status === 200) {
                    return;
                }
            }
            catch { }
            await (0, Utils_1.delay)(500);
        }
        throw new Error("Bundler isn't available.");
    }
}
exports.default = BundlerController;
//# sourceMappingURL=BundlerController.js.map