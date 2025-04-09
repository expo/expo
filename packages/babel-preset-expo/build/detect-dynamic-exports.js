"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectDynamicExports = detectDynamicExports;
const debug = require('debug')('expo:babel:exports');
// A babel pass to detect the usage of `module.exports` or `exports` in a module for use in
// export all expansion passes during tree shaking.
function detectDynamicExports(api) {
    const { types: t } = api;
    return {
        name: 'expo-detect-dynamic-exports',
        pre(file) {
            assertExpoMetadata(file.metadata);
            file.metadata.hasCjsExports = false;
        },
        visitor: {
            // Any usage of `module.exports` or `exports` will mark the module as non-static.
            // module.exports.a = 1;
            // exports.a = 1;
            CallExpression(path, state) {
                assertExpoMetadata(state.file.metadata);
                if (state.file.metadata.hasCjsExports)
                    return;
                const callee = path.node.callee;
                if (
                // Object.assign(...)
                t.isMemberExpression(callee) &&
                    t.isIdentifier(callee.object, { name: 'Object' }) &&
                    t.isIdentifier(callee.property, { name: 'assign' }) &&
                    // Allow `Object.assign(module.exports)` since it does nothing. Must have a second argument.
                    path.node.arguments.length > 1) {
                    const isModuleExports = t.isMemberExpression(path.node.arguments[0]) &&
                        t.isIdentifier(path.node.arguments[0].object, { name: 'module' }) &&
                        // Second argument is `exports` or 'exports'
                        // .exports
                        (t.isIdentifier(path.node.arguments[0].property, { name: 'exports' }) ||
                            // ['exports']
                            (t.isStringLiteral(path.node.arguments[0].property) &&
                                path.node.arguments[0].property.value === 'exports'));
                    // NOTE: Cannot match `['exp' + 'orts']`. We'd need to run after minification to match that confidently.
                    // Check for Object.assign(module.exports, ...), Object.assign(exports, ...)
                    if (
                    // module.exports
                    isModuleExports ||
                        // exports
                        t.isIdentifier(path.node.arguments[0], { name: 'exports' })) {
                        debug('Found Object.assign to module.exports or exports at ' + path.node.loc?.start.line);
                        state.file.metadata.hasCjsExports = true;
                    }
                }
            },
            AssignmentExpression(path, state) {
                assertExpoMetadata(state.file.metadata);
                if (state.file.metadata.hasCjsExports)
                    return;
                const left = path.node.left;
                // Detect module.exports.foo = ... or exports.foo = ...
                if ((t.isMemberExpression(left) &&
                    ((t.isIdentifier(left.object, { name: 'module' }) &&
                        (t.isIdentifier(left.property, { name: 'exports' }) ||
                            (t.isStringLiteral(left.property) && left.property.value === 'exports'))) ||
                        t.isIdentifier(left.object, { name: 'exports' }))) ||
                    ('object' in left &&
                        t.isMemberExpression(left.object) &&
                        t.isIdentifier(left.object.object, { name: 'module' }) &&
                        (t.isIdentifier(left.object.property, { name: 'exports' }) ||
                            (t.isStringLiteral(left.object.property) &&
                                left.object.property.value === 'exports')))) {
                    debug('Found assignment to module.exports or exports at ' + path.node.loc?.start.line);
                    state.file.metadata.hasCjsExports = true;
                }
                else if (t.isIdentifier(left, { name: 'exports' }) &&
                    path.scope.hasGlobal('exports') &&
                    // Ensure left is not defined in any scope
                    !path.scope.hasBinding('exports')) {
                    debug('Found assignment to exports at ' + path.node.loc?.start.line);
                    state.file.metadata.hasCjsExports = true;
                }
            },
        },
    };
}
function assertExpoMetadata(metadata) {
    if (metadata && typeof metadata === 'object') {
        return;
    }
    throw new Error('Expected Babel state.file.metadata to be an object');
}
