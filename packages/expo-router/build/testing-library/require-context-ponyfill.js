// @ts-expect-error: types node
import fs from 'node:fs';
// @ts-expect-error: types node
import path from 'node:path';
export default function requireContext(base = '.', scanSubDirectories = true, regularExpression = /\.[tj]sx?$/) {
    const files = {};
    function readDirectory(directory) {
        fs.readdirSync(directory).forEach((file) => {
            const fullPath = path.resolve(directory, file);
            const relativePath = `./${path.relative(base, fullPath)}`;
            if (fs.statSync(fullPath).isDirectory()) {
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
        return require(path.join(base, file));
    }, {
        keys: () => Object.keys(files),
        resolve: (key) => key,
        id: '0',
    });
    return context;
}
//# sourceMappingURL=require-context-ponyfill.js.map