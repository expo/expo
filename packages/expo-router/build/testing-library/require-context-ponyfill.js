// @ts-ignore: types node
import fs from 'node:fs';
// @ts-ignore: types node
import path from 'node:path';
export default function requireContext(base = '.', scanSubDirectories = true, regularExpression = /\.[tj]sx?$/, files = {}) {
    function readDirectory(directory) {
        fs.readdirSync(directory).forEach((file) => {
            const fullPath = path.resolve(directory, file);
            const relativePath = `./${path.relative(base, fullPath).split(path.sep).join('/')}`;
            if (fs.statSync(fullPath).isDirectory()) {
                if (scanSubDirectories)
                    readDirectory(fullPath);
                return;
            }
            if (!regularExpression.test(relativePath))
                return;
            files[relativePath] = true;
        });
    }
    if (fs.existsSync(base)) {
        readDirectory(base);
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