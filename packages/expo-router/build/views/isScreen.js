"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isScreen = isScreen;
const react_1 = require("react");
const Screen_1 = require("./Screen");
const StackElements_1 = require("../layouts/StackElements");
function isScreen(child, contextKey) {
    if ((0, react_1.isValidElement)(child) && child && (child.type === Screen_1.Screen || child.type === StackElements_1.StackScreen)) {
        if (typeof child.props === 'object' &&
            child.props &&
            'name' in child.props &&
            !child.props.name) {
            throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`);
        }
        if (process.env.NODE_ENV !== 'production') {
            if (['component', 'getComponent'].some((key) => child.props && typeof child.props === 'object' && key in child.props)) {
                throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`);
            }
        }
        return true;
    }
    return false;
}
//# sourceMappingURL=isScreen.js.map