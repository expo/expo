"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-expect-error: types node
const node_fs_1 = __importDefault(require("node:fs"));
// @ts-expect-error: types node
const node_path_1 = __importDefault(require("node:path"));
function requireContext(base = '.', scanSubDirectories = true, regularExpression = /\.[tj]sx?$/) {
    const files = {};
    function readDirectory(directory) {
        node_fs_1.default.readdirSync(directory).forEach((file) => {
            const fullPath = node_path_1.default.resolve(directory, file);
            const relativePath = `./${node_path_1.default.relative(base, fullPath)}`;
            if (node_fs_1.default.statSync(fullPath).isDirectory()) {
                if (scanSubDirectories)
                    readDirectory(fullPath);
                return;
            }
            if (!regularExpression.test(fullPath))
                return;
            files[relativePath] = true;
        });
    }
    readDirectory(base);
    const context = Object.assign(function Module(file) {
        return require(node_path_1.default.join(base, file));
    }, {
        keys: () => Object.keys(files),
        resolve: (key) => key,
        id: '0',
    });
    return context;
}
exports.default = requireContext;
//# sourceMappingURL=require-context-ponyfill.js.map