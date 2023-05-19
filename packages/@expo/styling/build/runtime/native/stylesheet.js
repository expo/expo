import { Dimensions, StyleSheet as RNStyleSheet, Appearance } from 'react-native';
import { animationMap, colorScheme, globalStyles, rem, styleMetaMap, vh, vw } from './globals';
const subscriptions = new Set();
/**
 * This is a custom wrapper around the React Native Stylesheet.
 * It allows us to intercept the creation of styles and "tag" them wit the metadata
 */
const parialStyleSheet = {
    rem,
    __subscribe(subscription) {
        subscriptions.add(subscription);
        return () => {
            subscriptions.delete(subscription);
        };
    },
    __reset({ dimensions = Dimensions, appearance = Appearance } = {}) {
        globalStyles.clear();
        rem.reset();
        vw.reset(dimensions);
        vh.reset(dimensions);
        colorScheme.reset(appearance);
    },
    register: (options) => {
        if (options.keyframes) {
            for (const [name, keyframes] of Object.entries(options.keyframes)) {
                animationMap.set(name, keyframes);
            }
        }
        if (options.declarations) {
            for (const [name, styles] of Object.entries(options.declarations)) {
                globalStyles.set(name, tagStyles(styles));
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
export const StyleSheet = Object.assign({}, RNStyleSheet, parialStyleSheet);
function tagStyles(styles) {
    if (Array.isArray(styles)) {
        let didTag = false;
        const taggedStyles = styles.map((s) => {
            const taggedStyle = tagStyles(s);
            didTag ||= styleMetaMap.has(s.style);
            return taggedStyle;
        });
        if (didTag) {
            styleMetaMap.set(taggedStyles, {});
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
            const requiresLayout = styles.animations.name?.some((nameObj) => {
                const name = nameObj.type === 'none' ? 'none' : nameObj.value;
                return animationMap.get(name)?.requiresLayout;
            });
            if (requiresLayout) {
                meta.requiresLayout = true;
            }
        }
        if (styles.container) {
            meta.container = {
                names: styles.container.names,
                type: styles.container.type ?? 'normal',
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
            styleMetaMap.set(styles.style, meta);
        }
        return styles.style;
    }
}
//# sourceMappingURL=stylesheet.js.map