"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requireContext;
// @ts-ignore: types node
const node_fs_1 = __importDefault(require("node:fs"));
// @ts-ignore: types node
const node_path_1 = __importDefault(require("node:path"));
function requireContext(base = '.', scanSubDirectories = true, regularExpression = /\.[tj]sx?$/, files = {}) {
    const baseTarget = node_path_1.default.resolve(base);
    function readDirectory(directory = '') {
        const target = node_path_1.default.resolve(baseTarget, directory);
        const entries = node_fs_1.default.readdirSync(target, { withFileTypes: true });
        for (const entry of entries) {
            const relativePath = directory ? node_path_1.default.join(directory, entry.name) : entry.name;
            if (entry.isDirectory()) {
                if (entry.name === 'node_modules') {
                    continue;
                }
                else if (scanSubDirectories) {
                    readDirectory(relativePath);
                }
            }
            else if (entry.isFile()) {
                const posixPath = `./${relativePath.split(node_path_1.default.sep).join('/')}`;
                if (regularExpression.test(posixPath)) {
                    files[posixPath] = true;
                }
            }
        }
    }
    if (node_fs_1.default.existsSync(baseTarget)) {
        readDirectory();
    }
    const context = Object.assign(function Module(file) {
        return require(node_path_1.default.join(base, file));
    }, {
        keys: () => Object.keys(files),
        resolve: (key) => key,
        id: '0',
        __add(file) {
            files[file] = true;
        },
        __delete(file) {
            delete files[file];
        },
    });
    return context;
}
//# sourceMappingURL=require-context-ponyfill.js.map