"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installDependencies = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
async function installDependencies(packageManager, appPath, ...args) {
    await (0, spawn_async_1.default)(packageManager, ['install', ...args], {
        cwd: appPath,
        stdio: 'ignore',
    });
}
exports.installDependencies = installDependencies;
//# sourceMappingURL=packageManager.js.map