"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore: types node
const node_fs_1 = __importDefault(require("node:fs"));
// @ts-ignore: types node
const node_path_1 = __importDefault(require("node:path"));
function requireContext(base = '.', scanSubDirectories = true, regularExpression = /\.[tj]sx?$/, files = {}) {
    function readDirectory(directory) {
        node_fs_1.default.readdirSync(directory).forEach((file) => {
            const fullPath = node_path_1.default.resolve(directory, file);
            const relativePath = `./${node_path_1.default.relative(base, fullPath).split(node_path_1.default.sep).join('/')}`;
            if (node_fs_1.default.statSync(fullPath).isDirectory()) {
                if (scanSubDirectories)
                    readDirectory(fullPath);
                return;
            }
            if (!regularExpression.test(relativePath))
                return;
            files[relativePath] = true;
        });
    }
    if (node_fs_1.default.existsSync(base)) {
        readDirectory(base);
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
exports.default = requireContext;
//# sourceMappingURL=require-context-ponyfill.js.map