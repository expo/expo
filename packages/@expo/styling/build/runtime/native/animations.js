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
exports.defaultTransformEntries = exports.transformProps = exports.defaultTransform = exports.defaultValues = exports.AnimationInterop = void 0;
const react_1 = __importStar(require("react"));
const react_native_reanimated_1 = require("react-native-reanimated");
const animated_component_1 = require("./animated-component");
const flatten_style_1 = require("./flatten-style");
const globals_1 = require("./globals");
/*
 * This component breaks the rules of hooks, however is it safe to do so as the animatedProps are static
 * If they do change, the key for this component will be regenerated forcing a remount (a reset of hooks)
 */
exports.AnimationInterop = (0, react_1.forwardRef)(function Animated({ __component: Component, __propEntries, __interaction: interaction, __variables, __containers, __interopMeta: interopMeta, ...props }, ref) {
    Component = (0, animated_component_1.createAnimatedComponent)(Component);
    const isLayoutReady = useIsLayoutReady(interopMeta, interaction);
    for (const prop of new Set([
        ...interopMeta.transitionProps,
        ...interopMeta.animatedProps,
    ])) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        props[prop] = useAnimationAndTransitions(props[prop], __variables, interaction, isLayoutReady);
    }
    return react_1.default.createElement(Component, { ref: ref, ...props });
});
/**
 * Returns if the component layout is calculated. If layout is not required, this will always return true
 */
function useIsLayoutReady(interopMeta, interaction) {
    const [layoutReady, setLayoutReady] = (0, react_1.useState)(interopMeta.requiresLayout ? interaction.layout.width.get() !== 0 : true);
    (0, react_1.useEffect)(() => {
        if (layoutReady) {
            return undefined;
        }
        // We only need to listen for a single layout change
        const subscription = interaction.layout.width.subscribe(() => {
            setLayoutReady(true);
            subscription();
        });
        return () => subscription();
    }, [layoutReady]);
    return layoutReady;
}
function useAnimationAndTransitions(style, variables, interaction, isLayoutReady) {
    const { animations: { name: animationNames = emptyArray, duration: animationDurations = emptyArray, iterationCount: animationIterationCounts = emptyArray, } = {}, transition: { property: transitions = emptyArray, duration: transitionDurations = emptyArray, } = {}, } = globals_1.styleMetaMap.get(style) || {};
    const [transitionProps, transitionValues] = useTransitions(transitions, transitionDurations, style);
    const [animationProps, animationValues] = useAnimations(animationNames, animationDurations, animationIterationCounts, style, variables, interaction, isLayoutReady);
    return (0, react_native_reanimated_1.useAnimatedStyle)(() => {
        var _a;
        const transformProps = new Set(Object.keys(exports.defaultTransform));
        const result = {
            ...style,
            // Reanimated crashes if the fontWeight is numeric
            fontWeight: (_a = style.fontWeight) === null || _a === void 0 ? void 0 : _a.toString(),
            transform: style.transform ? [] : undefined,
        };
        function doAnimation(props, values) {
            var _a;
            for (const [index, prop] of props.entries()) {
                const value = values[index].value;
                if (value !== undefined) {
                    if (transformProps.has(prop)) {
                        (_a = result.transform) !== null && _a !== void 0 ? _a : (result.transform = []);
                        result.transform.push({ [prop]: value });
                    }
                    else {
                        result[prop] = value;
                    }
                }
            }
        }
        doAnimation(transitionProps, transitionValues);
        doAnimation(animationProps, animationValues);
        return result;
    }, [...transitionValues, ...animationValues]);
}
function useTransitions(transitions, transitionDurations, style) {
    var _a, _b;
    const transitionProps = [];
    const transitionValues = [];
    for (let index = 0; index < transitions.length; index++) {
        const prop = transitions[index];
        const value = (_a = style[prop]) !== null && _a !== void 0 ? _a : exports.defaultValues[prop];
        const duration = timeToMS(getValue(transitionDurations, index, {
            type: "seconds",
            value: 0,
        }));
        if (prop === "transform") {
            const valueObj = Object.assign({}, ...(value || []));
            for (const tProp of exports.transformProps) {
                const tValue = (_b = valueObj[tProp]) !== null && _b !== void 0 ? _b : exports.defaultTransform[tProp];
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const sharedValue = (0, react_native_reanimated_1.useSharedValue)(tValue);
                transitionProps.push(tProp);
                transitionValues.push(sharedValue);
                sharedValue.value = (0, react_native_reanimated_1.withTiming)(tValue, { duration });
            }
        }
        else {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const sharedValue = (0, react_native_reanimated_1.useSharedValue)(value);
            transitionProps.push(prop);
            transitionValues.push(sharedValue);
            sharedValue.value = (0, react_native_reanimated_1.withTiming)(value, { duration });
        }
    }
    return [transitionProps, transitionValues];
}
function useAnimations(animationNames, animationDurations, animationIterationCounts, style, variables, interaction, isLayoutReady) {
    const animations = (0, react_1.useMemo)(() => {
        var _a, _b;
        const animations = new Map();
        for (let index = 0; index < animationNames.length; index++) {
            const name = getValue(animationNames, index, { type: "none" });
            const totalDuration = timeToMS(getValue(animationDurations, index, {
                type: "seconds",
                value: 0,
            }));
            let keyframes;
            if (name.type === "none") {
                keyframes = defaultAnimation;
            }
            else {
                keyframes = globals_1.animationMap.get(name.value) || defaultAnimation;
            }
            const propProgressValues = {};
            for (const { style: $style, selector: progress } of keyframes.frames) {
                const flatStyle = (0, flatten_style_1.flattenStyle)($style, {
                    variables,
                    interaction,
                    ch: typeof style.height === "number" ? style.height : undefined,
                    cw: typeof style.width === "number" ? style.width : undefined,
                });
                for (let [prop, value] of Object.entries(flatStyle)) {
                    if (prop === "transform") {
                        if (value.length === 0) {
                            value = exports.defaultTransformEntries;
                        }
                        for (const transformValue of value) {
                            const [[$prop, $value]] = Object.entries(transformValue);
                            (_a = propProgressValues[$prop]) !== null && _a !== void 0 ? _a : (propProgressValues[$prop] = {});
                            propProgressValues[$prop][progress] = $value;
                        }
                    }
                    else {
                        (_b = propProgressValues[prop]) !== null && _b !== void 0 ? _b : (propProgressValues[prop] = {});
                        propProgressValues[prop][progress] = value;
                    }
                }
            }
            for (const [prop, progressValues] of Object.entries(propProgressValues)) {
                const orderedProgress = Object.keys(progressValues)
                    .map((v) => parseFloat(v))
                    .sort((a, b) => a - b);
                const frames = [];
                if (orderedProgress[0] !== 0) {
                    frames.push({
                        progress: 0,
                        duration: 0,
                        value: PLACEHOLDER,
                    });
                }
                for (let i = 0; i < orderedProgress.length; i++) {
                    const progress = orderedProgress[i];
                    const value = progressValues[progress];
                    const previousProgress = progress === 0 || i === 0 ? 0 : orderedProgress[i - 1];
                    frames.push({
                        duration: totalDuration * (progress - previousProgress),
                        progress,
                        value,
                    });
                }
                animations.set(prop, frames);
            }
        }
        return animations;
    }, [animationNames, isLayoutReady]);
    /*
     * Create a shared value for each animation property with a default value
     */
    const animationProps = [];
    const animationValues = [];
    for (const [prop, [first]] of animations.entries()) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        animationValues.push((0, react_native_reanimated_1.useSharedValue)(getInitialValue(prop, first, style)));
        animationProps.push(prop);
    }
    /*
     * If the frames ever change, reset the animation
     * This also prevents the animation from resetting when other state changes
     */
    (0, react_1.useMemo)(() => {
        const entries = Array.from(animations.entries());
        for (const [index, [prop, [first, ...rest]]] of entries.entries()) {
            const sharedValue = animationValues[index];
            const iterations = getIterations(animationIterationCounts, index);
            // Reset the value to the first frame
            sharedValue.value = getInitialValue(prop, first, style);
            // Create timing animations for the rest of the frames
            const timing = rest.map(({ duration, value }) => {
                return (0, react_native_reanimated_1.withTiming)(value, { duration });
            });
            sharedValue.value = (0, react_native_reanimated_1.withRepeat)((0, react_native_reanimated_1.withSequence)(...timing), iterations);
        }
    }, [animations, animationIterationCounts]);
    return [animationProps, animationValues];
}
function getInitialValue(prop, frame, style) {
    var _a;
    if (frame.value === PLACEHOLDER) {
        if (exports.transformProps.has(prop)) {
            const initialTransform = (_a = style.transform) === null || _a === void 0 ? void 0 : _a.find((t) => {
                return t[prop] !== undefined;
            });
            return initialTransform
                ? initialTransform[prop]
                : exports.defaultTransform[prop];
        }
        else {
            return style[prop];
        }
    }
    else {
        return frame.value;
    }
}
function getValue(array, index, defaultValue) {
    return array && array.length > 0 ? array[index % array.length] : defaultValue;
}
const PLACEHOLDER = {};
const emptyArray = [];
const defaultAnimation = { frames: [] };
const timeToMS = (time) => {
    return time.type === "milliseconds" ? time.value : time.value * 1000;
};
const getIterations = (iterations, index) => {
    const iteration = getValue(iterations, index, { type: "infinite" });
    return iteration.type === "infinite" ? Infinity : iteration.value;
};
exports.defaultValues = {
    backgroundColor: "transparent",
    borderBottomColor: "transparent",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    borderColor: "transparent",
    borderLeftColor: "transparent",
    borderLeftWidth: 0,
    borderRadius: 0,
    borderRightColor: "transparent",
    borderRightWidth: 0,
    borderTopColor: "transparent",
    borderTopWidth: 0,
    borderWidth: 0,
    bottom: 0,
    color: "transparent",
    flex: 1,
    flexBasis: 1,
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "400",
    gap: 0,
    left: 0,
    lineHeight: 14,
    margin: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    maxHeight: 0,
    maxWidth: 0,
    minHeight: 0,
    minWidth: 0,
    opacity: 1,
    padding: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    right: 0,
    top: 0,
    zIndex: 0,
};
exports.defaultTransform = {
    perspective: 1,
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    rotate: "0deg",
    rotateX: "0deg",
    rotateY: "0deg",
    rotateZ: "0deg",
    skewX: "0deg",
    skewY: "0deg",
    scale: 1,
};
exports.transformProps = new Set(Object.keys(exports.defaultTransform));
exports.defaultTransformEntries = Object.entries(exports.defaultTransform).map(([key, value]) => ({ [key]: value }));
//# sourceMappingURL=animations.js.map