"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnWithIpcAsync = spawnWithIpcAsync;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const node_assert_1 = __importDefault(require("node:assert"));
async function spawnWithIpcAsync(command, args, options
// @ts-expect-error: spawnAsync returns a customized Promise
) {
    (0, node_assert_1.default)(options?.stdio == null, 'Cannot override stdio when using IPC');
    const promise = (0, spawn_async_1.default)(command, args, {
        ...options,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });
    const messageChunks = [];
    const appendMessage = (message) => {
        messageChunks.push(message);
    };
    promise.child.on('message', appendMessage);
    const result = await promise;
    promise.child.off('message', appendMessage);
    return {
        ...result,
        message: messageChunks.join(''),
    };
}
//# sourceMappingURL=SpawnIPC.js.map