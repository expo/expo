"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixHermesV1SuperInObjectAccessor = fixHermesV1SuperInObjectAccessor;
// TODO(@kitten): Workaround for facebook/hermes 18a963465 (genFunctionExpression for a
// Remove when fix is incorporated into RN's Hermes v1 version: https://github.com/facebook/hermes/commit/18a963465
// 2026-05-09: Currently, Hermes v1 is up to date to 2025-08-29. Fix is from 2025-11-04
function fixHermesV1SuperInObjectAccessor({ types: t, }) {
    return {
        name: 'fix-hermes-v1-super-in-object-accessor',
        visitor: {
            Super(path) {
                // Only super.x / super[expr] reaches the buggy home-object path. super() lives
                // only in derived class constructors and takes a different codepath.
                const parent = path.parent;
                if (parent.type !== 'MemberExpression' || parent.object !== path.node)
                    return;
                const accessor = findEnclosingNonComputedObjectAccessor(path);
                if (accessor) {
                    const key = accessor.key;
                    if (key.type === 'Identifier') {
                        accessor.key = t.stringLiteral(key.name);
                    }
                    else if (key.type !== 'StringLiteral') {
                        return;
                    }
                    accessor.computed = true;
                }
            },
        },
    };
}
function findEnclosingNonComputedObjectAccessor(path) {
    let parentPath = path.parentPath;
    while (parentPath) {
        const node = parentPath.node;
        const type = node.type;
        switch (type) {
            case 'ClassMethod':
            case 'ClassPrivateMethod':
            case 'FunctionExpression':
            case 'FunctionDeclaration':
            case 'StaticBlock':
            case 'ClassProperty':
            case 'ClassPrivateProperty':
                return null;
            case 'ObjectMethod':
                if (!node.computed && (node.kind === 'get' || node.kind === 'set')) {
                    return node;
                }
                else {
                    return null;
                }
        }
        parentPath = parentPath.parentPath;
    }
    return null;
}
//# sourceMappingURL=fix-hermes-v1-super-in-object-accessor.js.map