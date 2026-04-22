// @ts-ignore: types node
import fs from 'node:fs';
// @ts-ignore: types node
import path from 'node:path';
export default function requireContext(base = '.', scanSubDirectories = true, regularExpression = /\.[tj]sx?$/, files = {}) {
    const baseTarget = path.resolve(base);
    function readDirectory(directory = '') {
        const target = path.resolve(baseTarget, directory);
        const entries = fs.readdirSync(target, { withFileTypes: true });
        for (const entry of entries) {
            const relativePath = directory ? path.join(directory, entry.name) : entry.name;
            if (entry.isDirectory()) {
                if (entry.name === 'node_modules') {
                    continue;
                }
                else if (scanSubDirectories) {
                    readDirectory(relativePath);
                }
            }
            else if (entry.isFile()) {
                const posixPath = `./${relativePath.split(path.sep).join('/')}`;
                if (regularExpression.test(posixPath)) {
                    files[posixPath] = true;
                }
            }
        }
    }
    if (fs.existsSync(baseTarget)) {
        readDirectory();
    }
    const context = Object.assign(function Module(file) {
        return require(path.join(base, file));
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