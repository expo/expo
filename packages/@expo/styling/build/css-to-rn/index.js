"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cssToReactNativeRuntime = void 0;
const lightningcss_1 = require("lightningcss");
const shared_1 = require("../shared");
const parseDeclaration_1 = require("./parseDeclaration");
const utils_1 = require("./utils");
/**
 * Converts a CSS file to a collection of style declarations that can be used with the StyleSheet API
 *
 * @param {Buffer} code - The CSS file contents as a buffer
 * @param {CssToReactNativeRuntimeOptions} options - (Optional) Options for the conversion process
 * @returns {StyleSheetRegisterOptions} - An object containing the extracted style declarations and animations
 */
function cssToReactNativeRuntime(code, options = {}) {
    var _a, _b;
    // Create maps to store the extracted style declarations and animations
    const declarations = new Map();
    const keyframes = new Map();
    // Parse the grouping options to create an array of regular expressions
    const grouping = (_b = (_a = options.grouping) === null || _a === void 0 ? void 0 : _a.map((value) => {
        return typeof value === "string" ? new RegExp(value) : value;
    })) !== null && _b !== void 0 ? _b : [];
    // Use the lightningcss library to traverse the CSS AST and extract style declarations and animations
    (0, lightningcss_1.transform)({
        filename: "style.css",
        code,
        visitor: {
            Rule(rule) {
                // Extract the style declarations and animations from the current rule
                extractRule(rule, { ...options, grouping, declarations, keyframes }, options);
                // We have processed this rule, so now delete it from the AST
                return [];
            },
        },
    });
    // Convert the extracted style declarations and animations from maps to objects and return them
    return {
        declarations: Object.fromEntries(declarations),
        keyframes: Object.fromEntries(keyframes),
    };
}
exports.cssToReactNativeRuntime = cssToReactNativeRuntime;
/**
 * Extracts style declarations and animations from a given CSS rule, based on its type.
 *
 * @param {Rule} rule - The CSS rule to extract style declarations and animations from.
 * @param {ExtractRuleOptions} extractOptions - Options for the extraction process, including maps for storing extracted data.
 * @param {CssToReactNativeRuntimeOptions} parseOptions - Options for parsing the CSS code, such as grouping related rules together.
 */
function extractRule(rule, extractOptions, parseOptions) {
    // Check the rule's type to determine which extraction function to call
    switch (rule.type) {
        case "keyframes": {
            // If the rule is a keyframe animation, extract it with the `extractKeyFrames` function
            extractKeyFrames(rule.value, extractOptions, parseOptions);
            break;
        }
        case "container": {
            // If the rule is a container, extract it with the `extractedContainer` function
            extractedContainer(rule.value, extractOptions, parseOptions);
            break;
        }
        case "media": {
            // If the rule is a media query, extract it with the `extractMedia` function
            extractMedia(rule.value, extractOptions, parseOptions);
            break;
        }
        case "style": {
            // If the rule is a style declaration, extract it with the `getExtractedStyle` function and store it in the `declarations` map
            if (rule.value.declarations) {
                setStyleForSelectorList({
                    ...extractOptions.style,
                    ...getExtractedStyle(rule.value.declarations, parseOptions),
                }, rule.value.selectors, extractOptions);
            }
            break;
        }
    }
}
/**
 * This function takes in a MediaRule object, an ExtractRuleOptions object and a CssToReactNativeRuntimeOptions object,
 * and returns an array of MediaQuery objects representing styles extracted from screen media queries.
 *
 * @param mediaRule - The MediaRule object containing the media query and its rules.
 * @param extractOptions - The ExtractRuleOptions object to use when extracting styles.
 * @param parseOptions - The CssToReactNativeRuntimeOptions object to use when parsing styles.
 *
 * @returns undefined if no screen media queries are found in the mediaRule, else it returns the extracted styles.
 */
function extractMedia(mediaRule, extractOptions, parseOptions) {
    // Initialize an empty array to store screen media queries
    const media = [];
    // Iterate over all media queries in the mediaRule
    for (const mediaQuery of mediaRule.query.mediaQueries) {
        // Check if the media type is screen
        let isScreen = mediaQuery.mediaType !== "print";
        if (mediaQuery.qualifier === "not") {
            isScreen = !isScreen;
        }
        // If it's a screen media query, add it to the media array
        if (isScreen) {
            media.push(mediaQuery);
        }
    }
    if (media.length === 0) {
        return;
    }
    const newExtractOptions = {
        ...extractOptions,
        style: {
            media,
        },
    };
    // Iterate over all rules in the mediaRule and extract their styles using the updated ExtractRuleOptions
    for (const rule of mediaRule.rules) {
        extractRule(rule, newExtractOptions, parseOptions);
    }
}
/**
 * @param containerRule - The ContainerRule object containing the container query and its rules.
 * @param extractOptions - The ExtractRuleOptions object to use when extracting styles.
 * @param parseOptions - The CssToReactNativeRuntimeOptions object to use when parsing styles.
 */
function extractedContainer(containerRule, extractOptions, parseOptions) {
    // Create a new ExtractRuleOptions object with the updated container query information
    const newExtractOptions = {
        ...extractOptions,
        style: {
            containerQuery: [
                {
                    name: containerRule.name,
                    condition: containerRule.condition,
                },
            ],
        },
    };
    // Iterate over all rules inside the containerRule and extract their styles using the updated ExtractRuleOptions
    for (const rule of containerRule.rules) {
        extractRule(rule, newExtractOptions, parseOptions);
    }
}
/**
 * @param style - The ExtractedStyle object to use when setting styles.
 * @param selectorList - The SelectorList object containing the selectors to use when setting styles.
 * @param declarations - The declarations object to use when adding declarations.
 */
function setStyleForSelectorList(style, selectorList, { declarations, grouping = [] }) {
    for (const selector of selectorList) {
        // Find the last className selector in the selector list
        const classSelectorIndex = findLastIndex(selector, (s) => s.type === "class");
        // If no className selector is found, skip this selector
        if (classSelectorIndex === -1) {
            continue;
        }
        // Extract the conditions before the className selector
        const conditions = groupSelector(selector.slice(0, classSelectorIndex));
        // Check if all the conditions are valid based on the grouping in the ExtractRuleOptions
        const conditionValid = conditions.every((c) => {
            return grouping.some((g) => g.test(c.className));
        });
        // If not all the conditions are valid, skip this selector
        if (!conditionValid) {
            continue;
        }
        // Add the conditions to the declarations object
        for (const condition of conditions) {
            addDeclaration(condition.className, {
                style: {},
                container: {
                    names: [condition.className],
                },
            }, declarations);
        }
        let containerQueries = style.containerQuery;
        // If there are any conditions, add them to the container queries
        if (conditions.length > 0) {
            containerQueries !== null && containerQueries !== void 0 ? containerQueries : (containerQueries = []);
            for (const condition of conditions) {
                const containerQuery = {
                    name: condition.className,
                    pseudoClasses: condition.pseudoClasses,
                };
                containerQueries.push(containerQuery);
            }
        }
        // Extract the className selector and its pseudo-classes
        const groupedDelecarationSelectors = groupSelector(selector.slice(classSelectorIndex));
        // If there is more than one selector, skip this selector
        if (groupedDelecarationSelectors.length !== 1) {
            continue;
        }
        const [{ className, pseudoClasses }] = groupedDelecarationSelectors;
        // Add the className selector and its pseudo-classes to the declarations object, with the extracted style and container queries
        addDeclaration(className, { ...style, pseudoClasses, containerQuery: containerQueries }, declarations);
    }
}
function addDeclaration(className, style, declarations) {
    const existing = declarations.get(className);
    if (Array.isArray(existing)) {
        existing.push(style);
    }
    else if (existing) {
        declarations.set(className, [existing, style]);
    }
    else {
        declarations.set(className, style);
    }
}
function groupSelector(selectors) {
    var _a;
    let current;
    const groupedSelectors = [];
    for (const selector of selectors) {
        switch (selector.type) {
            case "combinator":
            case "universal":
            case "namespace":
            case "type":
            case "id":
            case "pseudo-element":
            case "nesting":
            case "attribute":
                current = undefined;
                break;
            case "class":
                // Selectors like .foo.bar are not valid
                if (current === null || current === void 0 ? void 0 : current.className) {
                    groupedSelectors.pop();
                    return [];
                }
                else {
                    current = {
                        className: selector.name,
                    };
                    groupedSelectors.push(current);
                }
                break;
            case "pseudo-class":
                switch (selector.kind) {
                    case "hover":
                    case "active":
                    case "focus":
                        if (!current)
                            break;
                        (_a = current.pseudoClasses) !== null && _a !== void 0 ? _a : (current.pseudoClasses = {});
                        current.pseudoClasses[selector.kind] = true;
                        break;
                }
                break;
            default:
                (0, utils_1.exhaustiveCheck)(selector);
        }
    }
    return groupedSelectors;
}
function extractKeyFrames(keyframes, extractOptions, options) {
    const extractedAnimation = { frames: [] };
    const frames = extractedAnimation.frames;
    for (const frame of keyframes.keyframes) {
        const { style } = getExtractedStyle(frame.declarations, {
            ...options,
            requiresLayout() {
                extractedAnimation.requiresLayout = true;
            },
        });
        for (const selector of frame.selectors) {
            const keyframe = selector.type === "percentage"
                ? selector.value * 100
                : selector.type === "from"
                    ? 0
                    : selector.type === "to"
                        ? 100
                        : undefined;
            if (keyframe === undefined)
                continue;
            switch (selector.type) {
                case "percentage":
                    frames.push({ selector: selector.value, style });
                    break;
                case "from":
                    frames.push({ selector: 0, style });
                    break;
                case "to":
                    frames.push({ selector: 1, style });
                    break;
                default:
                    (0, utils_1.exhaustiveCheck)(selector);
            }
        }
    }
    // Ensure there are always two frames, a start and end
    if (frames.length === 1) {
        frames.push({ selector: 0, style: {} });
    }
    extractedAnimation.frames = frames.sort((a, b) => a.selector - b.selector);
    extractOptions.keyframes.set(keyframes.name.value, extractedAnimation);
}
function getExtractedStyle(declarationBlock, options) {
    const extrtactedStyle = {
        style: {},
    };
    const declarationArray = [
        declarationBlock.declarations,
        declarationBlock.importantDeclarations,
    ]
        .flat()
        .filter((d) => !!d);
    /*
     * Adds a style property to the rule record.
     *
     * The shorthand option handles if the style came from a long or short hand property
     * E.g. `margin` is a shorthand property for `margin-top`, `margin-bottom`, `margin-left` and `margin-right`
     *
     * The `append` option allows the same property to be added multiple times
     * E.g. `transform` accepts an array of transforms
     */
    function addStyleProp(property, value, { shortHand = false, append = false } = {}) {
        var _a;
        if (value === undefined) {
            return;
        }
        if (property.startsWith("--")) {
            return addVariable(property, value);
        }
        property = kebabToCamelCase(property);
        const style = extrtactedStyle.style;
        if (append) {
            const styleValue = style[property];
            if (Array.isArray(styleValue)) {
                styleValue.push(...value);
            }
            else {
                style[property] = [value];
            }
        }
        else if (shortHand) {
            // If the shorthand property has already been set, don't overwrite it
            // The longhand property always have priority
            (_a = style[property]) !== null && _a !== void 0 ? _a : (style[property] = value);
        }
        else {
            style[property] = value;
        }
        if ((0, shared_1.isRuntimeValue)(value)) {
            extrtactedStyle.isDynamic = true;
        }
    }
    function addVariable(property, value) {
        var _a;
        (_a = extrtactedStyle.variables) !== null && _a !== void 0 ? _a : (extrtactedStyle.variables = {});
        extrtactedStyle.variables[property] = value;
    }
    function addContainerProp(declaration) {
        var _a, _b;
        let names = false;
        let type;
        switch (declaration.property) {
            case "container":
                if (declaration.value.name.type === "none") {
                    names = false;
                }
                else {
                    names = declaration.value.name.value;
                }
                type = declaration.value.containerType;
                break;
            case "container-name":
                if (declaration.value.type === "none") {
                    names = false;
                }
                else {
                    names = declaration.value.value;
                }
                break;
            case "container-type":
                type = declaration.value;
                break;
        }
        if (names === false) {
            return;
        }
        if (names) {
            (_a = extrtactedStyle.container) !== null && _a !== void 0 ? _a : (extrtactedStyle.container = {});
            extrtactedStyle.container.names = names;
        }
        if (type) {
            (_b = extrtactedStyle.container) !== null && _b !== void 0 ? _b : (extrtactedStyle.container = {});
            extrtactedStyle.container.type = type;
        }
    }
    function addTransitionProp(declaration) {
        var _a, _b, _c, _d, _e;
        (_a = extrtactedStyle.transition) !== null && _a !== void 0 ? _a : (extrtactedStyle.transition = {});
        switch (declaration.property) {
            case "transition-property":
                extrtactedStyle.transition.property = declaration.value.map((v) => {
                    return kebabToCamelCase(v.property);
                });
                break;
            case "transition-duration":
                extrtactedStyle.transition.duration = declaration.value;
                break;
            case "transition-delay":
                extrtactedStyle.transition.delay = declaration.value;
                break;
            case "transition-timing-function":
                extrtactedStyle.transition.timingFunction = declaration.value;
                break;
            case "transition": {
                let setProperty = true;
                let setDuration = true;
                let setDelay = true;
                let setTiming = true;
                // Shorthand properties cannot override the longhand property
                // So we skip setting the property if it already exists
                // Otherwise, we need to set the property to an empty array
                if (extrtactedStyle.transition.property) {
                    setProperty = false;
                }
                else {
                    extrtactedStyle.transition.property = [];
                }
                if (extrtactedStyle.transition.duration) {
                    setDuration = false;
                }
                else {
                    extrtactedStyle.transition.duration = [];
                }
                if (extrtactedStyle.transition.delay) {
                    setDelay = false;
                }
                else {
                    extrtactedStyle.transition.delay = [];
                }
                if (extrtactedStyle.transition.timingFunction) {
                    setTiming = false;
                }
                else {
                    extrtactedStyle.transition.timingFunction = [];
                }
                // Loop through each transition value and only set the properties that
                // were not already set by the longhand property
                for (const value of declaration.value) {
                    if (setProperty) {
                        (_b = extrtactedStyle.transition.property) === null || _b === void 0 ? void 0 : _b.push(kebabToCamelCase(value.property.property));
                    }
                    if (setDuration) {
                        (_c = extrtactedStyle.transition.duration) === null || _c === void 0 ? void 0 : _c.push(value.duration);
                    }
                    if (setDelay) {
                        (_d = extrtactedStyle.transition.delay) === null || _d === void 0 ? void 0 : _d.push(value.delay);
                    }
                    if (setTiming) {
                        (_e = extrtactedStyle.transition.timingFunction) === null || _e === void 0 ? void 0 : _e.push(value.timingFunction);
                    }
                }
                break;
            }
        }
    }
    function addAnimationProp(property, value) {
        var _a, _b, _c, _d;
        var _e;
        if (property === "animation") {
            const groupedProperties = {};
            for (const animation of value) {
                for (const [key, value] of Object.entries(animation)) {
                    (_a = groupedProperties[key]) !== null && _a !== void 0 ? _a : (groupedProperties[key] = []);
                    groupedProperties[key].push(value);
                }
            }
            (_b = extrtactedStyle.animations) !== null && _b !== void 0 ? _b : (extrtactedStyle.animations = {});
            for (const [property, value] of Object.entries(groupedProperties)) {
                const key = property
                    .replace("animation-", "")
                    .replace(/-./g, (x) => x[1].toUpperCase());
                (_c = (_e = extrtactedStyle.animations)[key]) !== null && _c !== void 0 ? _c : (_e[key] = value);
            }
        }
        else {
            const key = property
                .replace("animation-", "")
                .replace(/-./g, (x) => x[1].toUpperCase());
            (_d = extrtactedStyle.animations) !== null && _d !== void 0 ? _d : (extrtactedStyle.animations = {});
            extrtactedStyle.animations[key] = value;
        }
    }
    function requiresLayout() {
        extrtactedStyle.requiresLayout = true;
    }
    const parseDeclarationOptions = {
        addStyleProp,
        addAnimationProp,
        addContainerProp,
        addTransitionProp,
        requiresLayout,
        ...options,
    };
    for (const declaration of declarationArray) {
        (0, parseDeclaration_1.parseDeclaration)(declaration, parseDeclarationOptions);
    }
    return extrtactedStyle;
}
function findLastIndex(array, predicate) {
    for (let index = array.length - 1; index >= 0; index--) {
        if (predicate(array[index])) {
            return index;
        }
    }
    return -1;
}
function kebabToCamelCase(str) {
    return str.replace(/-./g, (x) => x[1].toUpperCase());
}
//# sourceMappingURL=index.js.map