import path from 'path';
import requireContext from './require-context-ponyfill';
export { requireContext };
export function inMemoryContext(context) {
    return Object.assign(function (id) {
        id = id.replace(/^\.\//, '').replace(/\.js$/, '');
        return typeof context[id] === 'function' ? { default: context[id] } : context[id];
    }, {
        keys: () => Object.keys(context).map((key) => './' + key + '.js'),
        resolve: (key) => key,
        id: '0',
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