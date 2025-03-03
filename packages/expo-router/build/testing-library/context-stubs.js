import path from 'path';
import requireContext from './require-context-ponyfill.mjs';
export { requireContext };
const validExtensions = ['.js', '.jsx', '.ts', '.tsx'];
export function inMemoryContext(context) {
    return Object.assign(function (id) {
        id = id.replace(/^\.\//, '').replace(/\.\w*$/, '');
        return typeof context[id] === 'function' ? { default: context[id] } : context[id];
    }, {
        resolve: (key) => key,
        id: '0',
        keys: () => Object.keys(context).map((key) => {
            const ext = path.extname(key);
            key = key.replace(/^\.\//, '');
            key = key.startsWith('/') ? key : `./${key}`;
            key = validExtensions.includes(ext) ? key : `${key}.js`;
            return key;
        }),
    });
}
export function requireContextWithOverrides(dir, overrides) {
    const existingContext = requireContext(path.resolve(process.cwd(), dir));
    return Object.assign(function (id) {
        if (id in overrides) {
            const route = overrides[id];
            return typeof route === 'function' ? { default: route } : route;
        }
        else {
            return existingContext(id);
        }
    }, {
        keys: () => [...Object.keys(overrides), ...existingContext.keys()],
        resolve: (key) => key,
        id: '0',
    });
}
//# sourceMappingURL=context-stubs.js.map