"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withLayoutContext = exports.useFilterScreenChildren = void 0;
const react_1 = __importStar(require("react"));
const Route_1 = require("../Route");
const useScreens_1 = require("../useScreens");
const Screen_1 = require("../views/Screen");
function useFilterScreenChildren(children, { isCustomNavigator, contextKey, } = {}) {
    return (0, react_1.useMemo)(() => {
        const customChildren = [];
        const screens = react_1.Children.map(children, (child) => {
            if ((0, react_1.isValidElement)(child) && child && child.type === Screen_1.Screen) {
                if (!child.props.name) {
                    throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`);
                }
                if (process.env.NODE_ENV !== 'production') {
                    if (['children', 'component', 'getComponent'].some((key) => key in child.props)) {
                        throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`children\`, \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`);
                    }
                }
                return child.props;
            }
            else {
                if (isCustomNavigator) {
                    customChildren.push(child);
                }
                else {
                    console.warn(`Layout children must be of type Screen, all other children are ignored. To use custom children, create a custom <Layout />. Update Layout Route at: "app${contextKey}/_layout"`);
                }
            }
        });
        // Add an assertion for development
        if (process.env.NODE_ENV !== 'production') {
            // Assert if names are not unique
            const names = screens?.map((screen) => screen.name);
            if (names && new Set(names).size !== names.length) {
                throw new Error('Screen names must be unique: ' + names);
            }
        }
        return {
            screens,
            children: customChildren,
        };
    }, [children]);
}
exports.useFilterScreenChildren = useFilterScreenChildren;
/**
 * Returns a navigator that automatically injects matched routes and renders nothing when there are no children.
 * Return type with `children` prop optional.
 */
function withLayoutContext(Nav, processor) {
    return Object.assign((0, react_1.forwardRef)(({ children: userDefinedChildren, ...props }, ref) => {
        const contextKey = (0, Route_1.useContextKey)();
        const { screens } = useFilterScreenChildren(userDefinedChildren, {
            contextKey,
        });
        const processed = processor ? processor(screens ?? []) : screens;
        const sorted = (0, useScreens_1.useSortedScreens)(processed ?? []);
        // Prevent throwing an error when there are no screens.
        if (!sorted.length) {
            return null;
        }
        return <Nav {...props} id={contextKey} ref={ref} children={sorted}/>;
    }), {
        Screen: Screen_1.Screen,
    });
}
exports.withLayoutContext = withLayoutContext;
//# sourceMappingURL=withLayoutContext.js.map