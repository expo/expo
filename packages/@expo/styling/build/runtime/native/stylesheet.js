"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleSheet = void 0;
const react_native_1 = require("react-native");
const globals_1 = require("./globals");
const subscriptions = new Set();
/**
 * This is a custom wrapper around the React Native Stylesheet.
 * It allows us to intercept the creation of styles and "tag" them wit the metadata
 */
const parialStyleSheet = {
    rem: globals_1.rem,
    __subscribe(subscription) {
        subscriptions.add(subscription);
        return () => {
            subscriptions.delete(subscription);
        };
    },
    __reset({ dimensions = react_native_1.Dimensions, appearance = react_native_1.Appearance } = {}) {
        globals_1.globalStyles.clear();
        globals_1.rem.reset();
        globals_1.vw.reset(dimensions);
        globals_1.vh.reset(dimensions);
        globals_1.colorScheme.reset(appearance);
    },
    register: (options) => {
        if (options.keyframes) {
            for (const [name, keyframes] of Object.entries(options.keyframes)) {
                globals_1.animationMap.set(name, keyframes);
            }
        }
        if (options.declarations) {
            for (const [name, styles] of Object.entries(options.declarations)) {
                globals_1.globalStyles.set(name, tagStyles(styles));
            }
        }
        for (const subscription of subscriptions) {
            subscription();
        }
    },
    create: (styles) => {
        const namedStyles = {};
        for (const [name, style] of Object.entries(styles)) {
            namedStyles[name] = tagStyles(style);
        }
        for (const subscription of subscriptions) {
            subscription();
        }
        return namedStyles;
    },
};
exports.StyleSheet = Object.assign({}, react_native_1.StyleSheet, parialStyleSheet);
function tagStyles(styles) {
    var _a, _b;
    if (Array.isArray(styles)) {
        let didTag = false;
        const taggedStyles = styles.map((s) => {
            const taggedStyle = tagStyles(s);
            didTag || (didTag = globals_1.styleMetaMap.has(s.style));
            return taggedStyle;
        });
        if (didTag) {
            globals_1.styleMetaMap.set(taggedStyles, {});
        }
        return taggedStyles;
    }
    else {
        const meta = {};
        let hasMeta = false;
        if (styles.isDynamic) {
            hasMeta = true;
        }
        if (styles.variables) {
            meta.variables = styles.variables;
            hasMeta = true;
        }
        if (Array.isArray(styles.media) && styles.media.length > 0) {
            meta.media = styles.media;
            hasMeta = true;
        }
        if (styles.pseudoClasses) {
            meta.pseudoClasses = styles.pseudoClasses;
            hasMeta = true;
        }
        if (styles.animations) {
            meta.animations = styles.animations;
            hasMeta = true;
            const requiresLayout = (_a = styles.animations.name) === null || _a === void 0 ? void 0 : _a.some((nameObj) => {
                var _a;
                const name = nameObj.type === "none" ? "none" : nameObj.value;
                return (_a = globals_1.animationMap.get(name)) === null || _a === void 0 ? void 0 : _a.requiresLayout;
            });
            if (requiresLayout) {
                meta.requiresLayout = true;
            }
        }
        if (styles.container) {
            meta.container = {
                names: styles.container.names,
                type: (_b = styles.container.type) !== null && _b !== void 0 ? _b : "normal",
            };
            hasMeta = true;
        }
        if (styles.containerQuery) {
            meta.containerQuery = styles.containerQuery;
            hasMeta = true;
        }
        if (styles.transition) {
            meta.transition = styles.transition;
            hasMeta = true;
        }
        if (styles.requiresLayout) {
            meta.requiresLayout = styles.requiresLayout;
            hasMeta = true;
        }
        if (hasMeta) {
            globals_1.styleMetaMap.set(styles.style, meta);
        }
        return styles.style;
    }
}
//# sourceMappingURL=stylesheet.js.map