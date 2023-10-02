"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withLayoutContext = exports.useFilterScreenChildren = void 0;
const react_1 = __importDefault(require("react"));
const Route_1 = require("../Route");
const useScreens_1 = require("../useScreens");
const Screen_1 = require("../views/Screen");
function useFilterScreenChildren(children, { isCustomNavigator, contextKey, } = {}) {
    return react_1.default.useMemo(() => {
        const customChildren = [];
        const screens = react_1.default.Children.map(children, (child) => {
            if (react_1.default.isValidElement(child) && child && child.type === Screen_1.Screen) {
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
/** Return a navigator that automatically injects matched routes and renders nothing when there are no children. Return type with children prop optional */
function withLayoutContext(Nav, processor) {
    const Navigator = react_1.default.forwardRef(({ children: userDefinedChildren, ...props }, ref) => {
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
        return (
        // @ts-expect-error
        react_1.default.createElement(Nav, { ...props, id: contextKey, ref: ref, children: sorted }));
    });
    // @ts-expect-error
    Navigator.Screen = Screen_1.Screen;
    // @ts-expect-error
    return Navigator;
}
exports.withLayoutContext = withLayoutContext;
//# sourceMappingURL=withLayoutContext.js.map