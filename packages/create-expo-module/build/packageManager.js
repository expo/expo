"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installDependencies = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
async function installDependencies(packageManager, appPath, ...args) {
    try {
        return await (0, spawn_async_1.default)(packageManager, ['install', ...args], {
            cwd: appPath,
        });
    }
    catch (error) {
        throw new Error(`${packageManager} install exited with non-zero code: ${error?.status}\n\nError stack:\n${error?.stderr}`);
    }
}
exports.installDependencies = installDependencies;
//# sourceMappingURL=packageManager.js.map