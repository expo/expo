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
exports.defaultCSSInterop = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const animations_1 = require("./animations");
const flatten_style_1 = require("./flatten-style");
const globals_1 = require("./globals");
const interaction_1 = require("./interaction");
const signals_1 = require("./signals");
const stylesheet_1 = require("./stylesheet");
/**
 * This is the default implementation of the CSS interop function. It is used to add CSS styles to React Native components.
 * @param jsx The JSX function that should be used to create the React elements.
 * @param type The React component type that should be rendered.
 * @param props The props object that should be passed to the component.
 * @param key The optional key to use for the component.
 * @param next Indicates whether this component should be rendered as a next.js component.
 * @returns The element rendered via the suppled JSX function
 */
function defaultCSSInterop(jsx, type, { ...props }, key, next = false) {
    // This sets the component type and specifies the style keys that should be used.
    props.__component = type;
    props.__styleKeys = ["style"];
    props.__next = next;
    /**
     * If the development environment is enabled, we should use the DevOnlyCSSInteropWrapper to wrap every component.
     * This wrapper subscribes to StyleSheet.register, so it can handle hot reloading of styles.
     */
    if (__DEV__) {
        return jsx(DevOnlyCSSInteropWrapper, props, key);
    }
    // Rewrite the className prop to a style object.
    props = classNameToStyle(props);
    // If the styles are dynamic, we need to wrap the component with the CSSInteropWrapper to handle style updates.
    return areStylesDynamic(props.style)
        ? jsx(CSSInteropWrapper, props, key)
        : jsx(type, props, key);
}
exports.defaultCSSInterop = defaultCSSInterop;
/**
 * This is the DevOnlyCSSInteropWrapper that should be used in development environments to handle async style updates.
 * It subscribes to StyleSheet.register, so it can handle style changes that may occur asynchronously.
 */
const DevOnlyCSSInteropWrapper = react_1.default.forwardRef(function DevOnlyCSSInteropWrapper({ __component: Component, __styleKeys, __next, ...props }, ref) {
    // This uses a reducer and the useEffect hook to subscribe to StyleSheet.register.
    const [, render] = (0, react_1.useReducer)(rerenderReducer, 0);
    (0, react_1.useEffect)(() => stylesheet_1.StyleSheet.__subscribe(render), []);
    // This applies the styles using the classNameToStyle function, which returns the style object.
    props = classNameToStyle(props);
    // If the styles are dynamic, we need to wrap the component with the CSSInteropWrapper to handle style updates.
    return areStylesDynamic(props.style) ? (react_1.default.createElement(CSSInteropWrapper, { ...props, ref: ref, __component: Component, __styleKeys: __styleKeys, __skipCssInterop: true, __next: __next })) : (react_1.default.createElement(Component, { ...props, ref: ref, __skipCssInterop: true }));
});
/**
 * This component is a wrapper that handles the styling interop between React Native and CSS functionality
 *
 * @remarks
 * The CSSInteropWrapper function has an internal state, interopMeta, which holds information about the styling props,
 * like if it's animated, if it requires a layout listener, if it has inline containers, etc. When a style prop changes, the component
 * calculates the new style and meta again using a helper function called flattenStyle.
 *
 * @param __component - Component to be rendered
 * @param __styleKeys - List of keys with the style props that need to be computed
 * @param __next - Flag indicating if should we should advanced featuers
 * @param $props - Any other props to be passed to the component
 * @param ref - Ref to the component
 */
const CSSInteropWrapper = react_1.default.forwardRef(function CSSInteropWrapper({ __component: Component, __styleKeys, __next: isNext, ...$props }, ref) {
    var _a, _b, _c, _d, _e;
    const [, rerender] = react_1.default.useReducer(rerenderReducer, 0);
    const inheritedVariables = react_1.default.useContext(globals_1.VariableContext);
    const inheritedContainers = react_1.default.useContext(globals_1.ContainerContext);
    const interaction = (0, interaction_1.useInteractionSignals)();
    /**
     * The purpose of interopMeta is to reduce the number of operations performed in the render function.
     * The meta is entirely derived from the computed styles, so we only need to calculate it when a style changes.
     *
     * The interopMeta object holds information about the styling props, like if it's animated, if it requires layout,
     * if it has inline containers, etc.
     *
     * The object is updated using the derived state pattern. The computation is done in the for loop below and
     * is stored in a variable $interopMeta. After that, the component checks if $interopMeta is different from interopMeta
     * to update the state.
     */
    const [$interopMeta, setInteropMeta] = (0, react_1.useState)(initialMeta);
    let interopMeta = $interopMeta;
    for (const key of __styleKeys) {
        /**
         * Create a computation that will flatten the style object.
         * Any signals read while the computation is running will be subscribed to.
         *
         * useComputation handles the reactivity/memoization
         * flattenStyle handles converting the schema to a style object and collecting the metadata
         */
        /* eslint-disable react-hooks/rules-of-hooks -- __styleKeys is immutable */
        const style = (0, signals_1.useComputation)(() => {
            return (0, flatten_style_1.flattenStyle)($props[key], {
                interaction,
                variables: inheritedVariables,
                containers: inheritedContainers,
            });
        }, [$props[key], inheritedVariables, inheritedContainers], rerender);
        /* eslint-enable react-hooks/rules-of-hooks */
        /*
         * Recalculate the interop meta when a style change occurs, due to a style update.
         * Rather than comparing the changes, we recalculate the entire meta.
         * To update the interop meta, we modify the `styledProps` and `styledPropsMeta` properties,
         * which will be flattened later.
         */
        if (interopMeta.styledProps[key] !== style) {
            const meta = (_a = globals_1.styleMetaMap.get(style)) !== null && _a !== void 0 ? _a : defaultMeta;
            interopMeta = {
                ...interopMeta,
                styledProps: { ...interopMeta.styledProps, [key]: style },
                styledPropsMeta: {
                    ...interopMeta.styledPropsMeta,
                    [key]: {
                        animated: Boolean(meta.animations),
                        transition: Boolean(meta.transition),
                        requiresLayout: Boolean(meta.requiresLayout),
                        variables: meta.variables,
                        containers: (_b = meta.container) === null || _b === void 0 ? void 0 : _b.names,
                        hasActive: (_c = meta.pseudoClasses) === null || _c === void 0 ? void 0 : _c.active,
                        hasHover: (_d = meta.pseudoClasses) === null || _d === void 0 ? void 0 : _d.hover,
                        hasFocus: (_e = meta.pseudoClasses) === null || _e === void 0 ? void 0 : _e.focus,
                    },
                },
            };
        }
    }
    // interopMeta has changed since last render (or it's the first render)
    // Recalculate the derived attributes and rerender
    if (interopMeta !== $interopMeta) {
        let hasInlineVariables = false;
        let hasInlineContainers = false;
        let requiresLayout = false;
        let hasActive = false;
        let hasHover = false;
        let hasFocus = false;
        const variables = {};
        const containers = {};
        const animatedProps = new Set();
        const transitionProps = new Set();
        for (const key of __styleKeys) {
            const meta = interopMeta.styledPropsMeta[key];
            Object.assign(variables, meta.variables);
            if (meta.variables)
                hasInlineVariables = true;
            if (meta.animated)
                animatedProps.add(key);
            if (meta.transition)
                transitionProps.add(key);
            if (meta.containers) {
                hasInlineContainers = true;
                const runtime = {
                    type: "normal",
                    interaction,
                    style: interopMeta.styledProps[key],
                };
                containers.__default = runtime;
                for (const name of meta.containers) {
                    containers[name] = runtime;
                }
            }
            requiresLayout || (requiresLayout = hasInlineContainers || meta.requiresLayout);
            hasActive || (hasActive = hasInlineContainers || meta.hasActive);
            hasHover || (hasHover = hasInlineContainers || meta.hasHover);
            hasFocus || (hasFocus = hasInlineContainers || meta.hasFocus);
        }
        let animationInteropKey = undefined;
        if (animatedProps.size > 0 || transitionProps.size > 0) {
            animationInteropKey = [...animatedProps, ...transitionProps].join(":");
        }
        interopMeta = {
            ...interopMeta,
            variables,
            containers,
            animatedProps,
            transitionProps,
            requiresLayout,
            hasInlineVariables,
            hasInlineContainers,
            animationInteropKey,
            hasActive,
            hasHover,
            hasFocus,
        };
        setInteropMeta(interopMeta);
    }
    if (Component === react_native_1.View &&
        (interopMeta.hasActive || interopMeta.hasHover || interopMeta.hasFocus)) {
        Component = react_native_1.Pressable;
    }
    const variables = (0, react_1.useMemo)(() => Object.assign({}, inheritedVariables, $interopMeta.variables), [inheritedVariables, $interopMeta.variables]);
    const containers = (0, react_1.useMemo)(() => Object.assign({}, inheritedContainers, $interopMeta.containers), [inheritedContainers, $interopMeta.containers]);
    // This doesn't need to be memoized as it's values will be spread across the component
    const props = {
        ...$props,
        ...interopMeta.styledProps,
        ...(0, interaction_1.useInteractionHandlers)($props, interaction, interopMeta),
    };
    let children = props.children;
    if ($interopMeta.hasInlineVariables) {
        children = (react_1.default.createElement(globals_1.VariableContext.Provider, { value: variables }, children));
    }
    if ($interopMeta.hasInlineContainers) {
        children = (react_1.default.createElement(globals_1.ContainerContext.Provider, { value: containers }, children));
    }
    if (isNext && $interopMeta.animationInteropKey) {
        return (react_1.default.createElement(animations_1.AnimationInterop, { ...props, ref: ref, key: $interopMeta.animationInteropKey, __component: Component, __variables: variables, __containers: inheritedContainers, __interaction: interaction, __interopMeta: $interopMeta, __skipCssInterop: true }, children));
    }
    else {
        return (react_1.default.createElement(Component, { ...props, ref: ref, __skipCssInterop: true }, children));
    }
});
/**
 * Maps each class name in the `className` property of the input object
 * to its corresponding global style object and combines the resulting
 * array of styles with any existing styles in the `style` property of
 * the input object.
 *
 * @param props - An object that may contain a `className` property and a `style` property
 * @returns The modified input object with updated `style` property
 */
function classNameToStyle({ className, ...props }) {
    if (typeof className === "string") {
        // Split className string into an array of class names, then map each class
        // name to its corresponding global style object, if one exists.
        const classNameStyle = className
            .split(/\s+/)
            .map((s) => globals_1.globalStyles.get(s));
        // Combine the resulting array of styles with any existing styles in the `style` property
        // of the input object.
        props.style = Array.isArray(props.style)
            ? [...classNameStyle, ...props.style]
            : props.style
                ? [...classNameStyle, props.style]
                : classNameStyle;
        // If there is only one style in the resulting array, replace the array with that single style.
        if (Array.isArray(props.style) && props.style.length <= 1) {
            props.style = props.style[0];
        }
    }
    return props;
}
/**
 * Determines whether a style object or array of style objects contains dynamic styles.
 * @param style The style object or array of style objects to check.
 * @returns True if the style object or array contains dynamic styles; otherwise, false.
 */
function areStylesDynamic(style) {
    if (!style)
        return false; // If there is no style, it can't be dynamic.
    if (globals_1.styleMetaMap.has(style))
        return true; // If it's already tagged, it's dynamic.
    // If we have an array of styles, check each one.
    // We can then tag the array so we don't have to check it again.
    if (Array.isArray(style) && style.some(areStylesDynamic)) {
        globals_1.styleMetaMap.set(style, {}); // Tag the array so we don't have to check it again.
        return true;
    }
    return false;
}
/* Micro optimizations. Save these externally so they are not recreated every render  */
const rerenderReducer = (acc) => acc + 1;
const defaultMeta = { container: { names: [], type: "normal" } };
const initialMeta = {
    styledProps: {},
    styledPropsMeta: {},
    variables: {},
    containers: {},
    animatedProps: new Set(),
    transitionProps: new Set(),
    requiresLayout: false,
    hasInlineVariables: false,
    hasInlineContainers: false,
};
//# sourceMappingURL=css-interop.js.map