"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertIconColorPropToObject = convertIconColorPropToObject;
exports.useAwaitedScreensIcon = useAwaitedScreensIcon;
exports.convertOptionsIconToRNScreensPropsIcon = convertOptionsIconToRNScreensPropsIcon;
exports.getRNScreensAndroidIconResourceFromAwaitedIcon = getRNScreensAndroidIconResourceFromAwaitedIcon;
exports.getRNScreensAndroidIconResourceNameFromAwaitedIcon = getRNScreensAndroidIconResourceNameFromAwaitedIcon;
const react_1 = require("react");
function convertIconColorPropToObject(iconColor) {
    if (iconColor) {
        if (typeof iconColor === 'object' && ('default' in iconColor || 'selected' in iconColor)) {
            return iconColor;
        }
        return {
            default: iconColor,
        };
    }
    return {};
}
function useAwaitedScreensIcon(icon) {
    const src = icon && typeof icon === 'object' && 'src' in icon ? icon.src : undefined;
    const [awaitedIcon, setAwaitedIcon] = (0, react_1.useState)(undefined);
    (0, react_1.useEffect)(() => {
        const loadIcon = async () => {
            if (src && src instanceof Promise) {
                const awaitedSrc = await src;
                if (awaitedSrc) {
                    const currentAwaitedIcon = { src: awaitedSrc };
                    setAwaitedIcon(currentAwaitedIcon);
                }
            }
        };
        loadIcon();
        // Checking `src` rather then icon here, to avoid unnecessary re-renders
        // The icon object can be recreated, while src should stay the same
        // In this case as we control `VectorIcon`, it will only change if `family` or `name` props change
        // So we should be safe with promise resolving
    }, [src]);
    return (0, react_1.useMemo)(() => (isAwaitedIcon(icon) ? icon : awaitedIcon), [awaitedIcon, icon]);
}
function isAwaitedIcon(icon) {
    return !icon || !('src' in icon && icon.src instanceof Promise);
}
function convertOptionsIconToRNScreensPropsIcon(icon) {
    if (!icon) {
        return undefined;
    }
    if ('sf' in icon && icon.sf) {
        return { sfSymbolName: icon.sf };
    }
    else if ('src' in icon && icon.src) {
        return { templateSource: icon.src };
    }
    return undefined;
}
function getRNScreensAndroidIconResourceFromAwaitedIcon(icon) {
    if (icon && 'src' in icon && icon.src) {
        return icon.src;
    }
    return undefined;
}
function getRNScreensAndroidIconResourceNameFromAwaitedIcon(icon) {
    if (icon && 'drawable' in icon && icon.drawable) {
        return icon.drawable;
    }
    return undefined;
}
//# sourceMappingURL=icon.js.map