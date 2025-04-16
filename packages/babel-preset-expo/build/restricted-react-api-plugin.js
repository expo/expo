"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.environmentRestrictedReactAPIsPlugin = environmentRestrictedReactAPIsPlugin;
const INVALID_SERVER_REACT_DOM_APIS = [
    'findDOMNode',
    'flushSync',
    'unstable_batchedUpdates',
    'useFormStatus',
    'useFormState',
];
// From the React docs: https://github.com/vercel/next.js/blob/d43a387d271263f2c1c4da6b9db826e382fc489c/packages/next-swc/crates/next-custom-transforms/src/transforms/react_server_components.rs#L665-L681
const INVALID_SERVER_REACT_APIS = [
    'Component',
    'createContext',
    'createFactory',
    'PureComponent',
    'useDeferredValue',
    'useEffect',
    'useImperativeHandle',
    'useInsertionEffect',
    'useLayoutEffect',
    'useReducer',
    'useRef',
    'useState',
    'useSyncExternalStore',
    'useTransition',
    'useOptimistic',
];
function isNodeModule(path) {
    return path != null && /[\\/]node_modules[\\/]/.test(path);
}
// Restricts imports from `react` and `react-dom` when using React Server Components.
const FORBIDDEN_IMPORTS = {
    react: INVALID_SERVER_REACT_APIS,
    'react-dom': INVALID_SERVER_REACT_DOM_APIS,
};
function environmentRestrictedReactAPIsPlugin(api) {
    const { types: t } = api;
    return {
        name: 'expo-environment-restricted-react-api-plugin',
        visitor: {
            ImportDeclaration(path, state) {
                // Skip node_modules
                if (isNodeModule(state.file.opts.filename)) {
                    return;
                }
                const sourceValue = path.node.source.value;
                const forbiddenList = FORBIDDEN_IMPORTS[sourceValue];
                if (forbiddenList) {
                    path.node.specifiers.forEach((specifier) => {
                        if (t.isImportSpecifier(specifier)) {
                            const importName = t.isStringLiteral(specifier.imported)
                                ? specifier.imported.value
                                : specifier.imported.name;
                            // Check for both named and namespace imports
                            const isForbidden = forbiddenList.includes(importName);
                            if (isForbidden) {
                                if (['Component', 'PureComponent'].includes(importName)) {
                                    // Add special handling for `Component` since it is different to a function API.
                                    throw path.buildCodeFrameError(`Client-only "${sourceValue}" API "${importName}" cannot be imported in a React server component. Add the "use client" directive to the top of this file or one of the parent files to enable running this stateful code on a user's device.`);
                                }
                                else {
                                    const forbiddenImports = path.scope.getData('forbiddenImports') ?? new Map();
                                    if (!forbiddenImports.has(sourceValue))
                                        forbiddenImports.set(sourceValue, new Set());
                                    forbiddenImports.get(sourceValue).add(importName);
                                    path.scope.setData('forbiddenImports', forbiddenImports);
                                }
                            }
                        }
                        else {
                            const importName = t.isStringLiteral(specifier.local)
                                ? specifier.local
                                : specifier.local.name;
                            // Save namespace import for later checks in MemberExpression
                            path.scope.setData('importedNamespace', { [importName]: sourceValue });
                        }
                    });
                }
            },
            // Match against `var _useState = useState(0),`
            VariableDeclarator(path) {
                const importedSpecifiers = path.scope.getData('forbiddenImports');
                if (!importedSpecifiers)
                    return;
                importedSpecifiers.forEach((forbiddenApis, importName) => {
                    if (t.isCallExpression(path.node.init) && t.isIdentifier(path.node.init.callee)) {
                        if (forbiddenApis.has(path.node.init.callee.name)) {
                            throw path.buildCodeFrameError(`Client-only "useState" API cannot be used in a React server component. Add the "use client" directive to the top of this file or one of the parent files to enable running this stateful code on a user's device.`);
                        }
                    }
                });
            },
            MemberExpression(path) {
                const importedNamespaces = path.scope.getData('importedNamespace') || {};
                Object.keys(importedNamespaces).forEach((namespace) => {
                    const library = importedNamespaces[namespace];
                    const forbiddenList = FORBIDDEN_IMPORTS[library];
                    const objectName = t.isIdentifier(path.node.object) ? path.node.object.name : null;
                    if (objectName === namespace &&
                        forbiddenList &&
                        t.isIdentifier(path.node.property) &&
                        forbiddenList.includes(path.node.property.name)) {
                        // Throw a special error for class components since it's not always clear why they cannot be used in RSC.
                        // e.g. https://x.com/Baconbrix/status/1749223042440392806?s=20
                        if (path.node.property.name === 'Component') {
                            throw path.buildCodeFrameError(`Class components cannot be used in a React server component due to their ability to contain stateful and interactive APIs that cannot be statically evaluated in non-interactive environments such as a server or at build-time. Migrate to a function component, or add the "use client" directive to the top of this file or one of the parent files to render this class component on a user's device.`);
                        }
                        throw path.buildCodeFrameError(`Client-only "${namespace}" API "${path.node.property.name}" cannot be used in a React server component. Add the "use client" directive to the top of this file or one of the parent files to enable running this stateful code on a user's device.`);
                    }
                });
            },
        },
    };
}
