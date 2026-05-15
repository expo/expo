"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertIconColorPropToObject = convertIconColorPropToObject;
exports.useAwaitedScreensIcon = useAwaitedScreensIcon;
exports.convertComponentSrcToImageSource = convertComponentSrcToImageSource;
const react_1 = require("react");
const children_1 = require("../../utils/children");
const elements_1 = require("../common/elements");
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
    const renderingMode = icon && typeof icon === 'object' && 'renderingMode' in icon ? icon.renderingMode : undefined;
    const [awaitedIcon, setAwaitedIcon] = (0, react_1.useState)(undefined);
    (0, react_1.useEffect)(() => {
        const loadIcon = async () => {
            if (src && src instanceof Promise) {
                const awaitedSrc = await src;
                if (awaitedSrc) {
                    setAwaitedIcon({ src: awaitedSrc });
                }
            }
        };
        loadIcon();
        // Checking `src` rather then icon here, to avoid unnecessary re-renders
        // The icon object can be recreated, while src should stay the same
        // In this case as we control `VectorIcon`, it will only change if `family` or `name` props change
        // So we should be safe with promise resolving
    }, [src]);
    return (0, react_1.useMemo)(() => {
        const resolved = isAwaitedIcon(icon) ? icon : awaitedIcon;
        if (resolved && renderingMode && 'src' in resolved) {
            return { ...resolved, renderingMode };
        }
        return resolved;
    }, [awaitedIcon, icon, renderingMode]);
}
function isAwaitedIcon(icon) {
    return !icon || !('src' in icon && icon.src instanceof Promise);
}
function convertComponentSrcToImageSource(src, renderingMode) {
    let result;
    if ((0, children_1.isChildOfType)(src, elements_1.NativeTabsTriggerVectorIcon)) {
        const props = src.props;
        result = { src: props.family.getImageSource(props.name, 24, 'white') };
    }
    else if ((0, children_1.isChildOfType)(src, elements_1.NativeTabsTriggerPromiseIcon)) {
        result = { src: src.props.loader() };
    }
    else {
        console.warn('Only VectorIcon is supported as a React element in Icon.src');
        return undefined;
    }
    if (renderingMode) {
        result = { ...result, renderingMode };
    }
    return result;
}
//# sourceMappingURL=icon.js.map