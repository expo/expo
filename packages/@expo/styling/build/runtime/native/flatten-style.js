"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenStyle = void 0;
const shared_1 = require("../../shared");
const conditions_1 = require("./conditions");
const globals_1 = require("./globals");
/**
 * Reduce a StyleProp to a flat Style object.
 *
 * @remarks
 * As we loop over keys & values, we will resolve any dynamic values.
 * Some values cannot be calculated until the entire style has been flattened.
 * These values are defined as a getter and will be resolved lazily.
 *
 * @param styles The style or styles to flatten.
 * @param options The options for flattening the styles.
 * @param flatStyle The flat style object to add the flattened styles to.
 * @returns The flattened style object.
 */
function flattenStyle(styles, options, flatStyle) {
    var _a, _b, _c;
    let flatStyleMeta;
    if (!flatStyle) {
        flatStyle = {};
        flatStyleMeta = {};
        globals_1.styleMetaMap.set(flatStyle, flatStyleMeta);
    }
    else {
        flatStyleMeta = (_a = globals_1.styleMetaMap.get(flatStyle)) !== null && _a !== void 0 ? _a : {};
    }
    if (!styles) {
        return flatStyle;
    }
    if (Array.isArray(styles)) {
        // We need to flatten in reverse order so that the last style in the array is the one defined
        for (let i = styles.length - 1; i >= 0; i--) {
            if (styles[i]) {
                flattenStyle(styles[i], options, flatStyle);
            }
        }
        return flatStyle;
    }
    // The is the metadata for the style object.
    // It contains information is like the MediaQuery data
    //
    // Note: This is different to flatStyleMeta, which is the metadata
    // for the FLATTENED style object
    const styleMeta = globals_1.styleMetaMap.get(styles) || {};
    /*
     * TODO: Investigate if we early exit if there is no styleMeta.
     */
    /*
     * START OF CONDITIONS CHECK
     *
     * If any of these fail, this style and its metadata will be skipped
     */
    if (styleMeta.pseudoClasses) {
        flatStyleMeta.pseudoClasses = {
            ...styleMeta.pseudoClasses,
            ...flatStyleMeta.pseudoClasses,
        };
        if (!(0, conditions_1.testPseudoClasses)(options.interaction, styleMeta.pseudoClasses)) {
            return flatStyle;
        }
    }
    // Skip failed media queries
    if (styleMeta.media && !styleMeta.media.every((m) => (0, conditions_1.testMediaQuery)(m))) {
        return flatStyle;
    }
    if (!(0, conditions_1.testContainerQuery)(styleMeta.containerQuery, options.containers)) {
        return flatStyle;
    }
    /*
     * END OF CONDITIONS CHECK
     */
    if (styleMeta.animations) {
        flatStyleMeta.animations = {
            ...styleMeta.animations,
            ...flatStyleMeta.animations,
        };
    }
    if (styleMeta.transition) {
        flatStyleMeta.transition = {
            ...styleMeta.transition,
            ...flatStyleMeta.transition,
        };
    }
    if (styleMeta.container) {
        (_b = flatStyleMeta.container) !== null && _b !== void 0 ? _b : (flatStyleMeta.container = { type: "normal", names: [] });
        if (styleMeta.container.names) {
            flatStyleMeta.container.names = styleMeta.container.names;
        }
        if (styleMeta.container.type) {
            flatStyleMeta.container.type = styleMeta.container.type;
        }
    }
    if (styleMeta.requiresLayout) {
        flatStyleMeta.requiresLayout = true;
    }
    if (styleMeta.variables) {
        (_c = flatStyleMeta.variables) !== null && _c !== void 0 ? _c : (flatStyleMeta.variables = {});
        for (const [key, value] of Object.entries(styleMeta.variables)) {
            // Skip already set variables
            if (key in flatStyleMeta.variables)
                continue;
            const getterOrValue = extractValue(value, flatStyle, flatStyleMeta, options);
            if (typeof getterOrValue === "function") {
                Object.defineProperty(flatStyleMeta.variables, key, {
                    enumerable: true,
                    get() {
                        return getterOrValue();
                    },
                });
            }
            else {
                flatStyleMeta.variables[key] = getterOrValue;
            }
        }
    }
    for (const [key, value] of Object.entries(styles)) {
        // Skip already set keys
        if (key in flatStyle)
            continue;
        if (key === "transform") {
            const transforms = [];
            for (const transform of value) {
                // Transform is either an React Native transform object OR
                // A extracted value with type: "function"
                if ("type" in transform) {
                    const getterOrValue = extractValue(transform, flatStyle, flatStyleMeta, options);
                    if (getterOrValue === undefined) {
                        continue;
                    }
                    else if (typeof getterOrValue === "function") {
                        transforms.push(Object.defineProperty({}, transform.name, {
                            configurable: true,
                            enumerable: true,
                            get() {
                                return getterOrValue();
                            },
                        }));
                    }
                }
                else {
                    for (const [tKey, tValue] of Object.entries(transform)) {
                        const $transform = {};
                        const getterOrValue = extractValue(tValue, flatStyle, flatStyleMeta, options);
                        if (typeof getterOrValue === "function") {
                            Object.defineProperty($transform, tKey, {
                                configurable: true,
                                enumerable: true,
                                get() {
                                    return getterOrValue();
                                },
                            });
                        }
                        else {
                            $transform[tKey] = getterOrValue;
                        }
                        transforms.push($transform);
                    }
                }
            }
            flatStyle.transform = transforms;
        }
        else {
            const getterOrValue = extractValue(value, flatStyle, flatStyleMeta, options);
            if (typeof getterOrValue === "function") {
                Object.defineProperty(flatStyle, key, {
                    configurable: true,
                    enumerable: true,
                    get() {
                        return getterOrValue();
                    },
                });
            }
            else {
                flatStyle[key] = getterOrValue;
            }
        }
    }
    return flatStyle;
}
exports.flattenStyle = flattenStyle;
/**
 * Extracts a value from a StyleProp.
 * If the value is a dynamic value, it will be resolved.
 * @param value - The value to extract.
 * @param flatStyle - The flat Style object being built.
 * @param flatStyleMeta - Metadata for the flat Style object.
 * @param options - Options for flattening the StyleProp.
 * @returns The extracted value.
 */
function extractValue(value, flatStyle, flatStyleMeta, options) {
    var _a, _b;
    if ((0, shared_1.isRuntimeValue)(value)) {
        switch (value.name) {
            case "vh":
                return round((globals_1.vh.get() / 100) * value.arguments[0]);
            case "vw":
                return round((globals_1.vw.get() / 100) * value.arguments[0]);
            case "var":
                return () => {
                    var _a, _b;
                    const name = value.arguments[0];
                    const resolvedValue = (_b = (_a = flatStyleMeta.variables) === null || _a === void 0 ? void 0 : _a[name]) !== null && _b !== void 0 ? _b : options.variables[name];
                    return typeof resolvedValue === "function"
                        ? resolvedValue()
                        : resolvedValue;
                };
            case "rem":
                return round(globals_1.rem.get() * value.arguments[0]);
            case "em":
                return () => {
                    const multiplier = value.arguments[0];
                    if ("fontSize" in flatStyle) {
                        return round((flatStyle.fontSize || 0) * multiplier);
                    }
                    return undefined;
                };
            case "ch": {
                const multiplier = value.arguments[0];
                let reference;
                if (options.ch) {
                    reference = options.ch;
                }
                else if ((_a = options.interaction) === null || _a === void 0 ? void 0 : _a.layout.height.get()) {
                    reference = options.interaction.layout.height.get();
                }
                else if (typeof flatStyle.height === "number") {
                    reference = flatStyle.height;
                }
                if (reference) {
                    return round(reference * multiplier);
                }
                else {
                    return () => {
                        var _a;
                        if ((_a = options.interaction) === null || _a === void 0 ? void 0 : _a.layout.height.get()) {
                            reference = options.interaction.layout.height.get();
                        }
                        else if (typeof flatStyle.height === "number") {
                            reference = flatStyle.height;
                        }
                        else {
                            reference = 0;
                        }
                        return round(reference * multiplier);
                    };
                }
            }
            case "cw": {
                const multiplier = value.arguments[0];
                let reference;
                if (options.cw) {
                    reference = options.cw;
                }
                else if ((_b = options.interaction) === null || _b === void 0 ? void 0 : _b.layout.width.get()) {
                    reference = options.interaction.layout.width.get();
                }
                else if (typeof flatStyle.width === "number") {
                    reference = flatStyle.width;
                }
                if (reference) {
                    return round(reference * multiplier);
                }
                else {
                    return () => {
                        var _a;
                        if ((_a = options.interaction) === null || _a === void 0 ? void 0 : _a.layout.width.get()) {
                            reference = options.interaction.layout.width.get();
                        }
                        else if (typeof flatStyle.width === "number") {
                            reference = flatStyle.width;
                        }
                        else {
                            reference = 0;
                        }
                        return round(reference * multiplier);
                    };
                }
            }
            case "perspective":
            case "translateX":
            case "translateY":
            case "scaleX":
            case "scaleY":
            case "scale":
                return extractRuntimeFunction(value, flatStyle, flatStyleMeta, options, { shouldRunwrap: true, shouldParseFloat: true });
            case "rotate":
            case "rotateX":
            case "rotateY":
            case "rotateZ":
            case "skewX":
            case "skewY":
                return extractRuntimeFunction(value, flatStyle, flatStyleMeta, options, { shouldRunwrap: true });
            default: {
                return extractRuntimeFunction(value, flatStyle, flatStyleMeta, options);
            }
        }
    }
    return value;
}
function extractRuntimeFunction(value, flatStyle, flatStyleMeta, options, { shouldRunwrap = false, shouldParseFloat = false } = {}) {
    let isStatic = true;
    const args = [];
    for (const arg of value.arguments) {
        const getterOrValue = extractValue(arg, flatStyle, flatStyleMeta, options);
        if (typeof getterOrValue === "function") {
            isStatic = false;
        }
        args.push(getterOrValue);
    }
    const valueFn = () => {
        const $args = args
            .map((a) => (typeof a === "function" ? a() : a))
            .filter((a) => a !== undefined)
            .join(", ");
        if ($args === "") {
            return;
        }
        const result = shouldRunwrap ? $args : `${value.name}(${$args})`;
        return shouldParseFloat ? parseFloat(result) : result;
    };
    return isStatic ? valueFn() : valueFn;
}
function round(number) {
    return Math.round((number + Number.EPSILON) * 100) / 100;
}
//# sourceMappingURL=flatten-style.js.map