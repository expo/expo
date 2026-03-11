"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertIconColorPropToObject = convertIconColorPropToObject;
exports.useAwaitedScreensIcon = useAwaitedScreensIcon;
exports.convertOptionsIconToRNScreensPropsIcon = convertOptionsIconToRNScreensPropsIcon;
exports.convertOptionsIconToIOSPropsIcon = convertOptionsIconToIOSPropsIcon;
exports.convertOptionsIconToAndroidPropsIcon = convertOptionsIconToAndroidPropsIcon;
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
function convertOptionsIconToRNScreensPropsIcon(icon, iconColor) {
    if (!icon) {
        return undefined;
    }
    return {
        ios: convertOptionsIconToIOSPropsIcon(icon, iconColor),
        android: convertOptionsIconToAndroidPropsIcon(icon),
    };
}
function convertOptionsIconToIOSPropsIcon(icon, iconColor) {
    if (icon && 'sf' in icon && icon.sf) {
        return {
            type: 'sfSymbol',
            name: icon.sf,
        };
    }
    if (icon && (('xcasset' in icon && icon.xcasset) || ('src' in icon && icon.src))) {
        const imageSource = 'xcasset' in icon && icon.xcasset
            ? { uri: icon.xcasset }
            : icon.src;
        const renderingMode = 'renderingMode' in icon ? icon.renderingMode : undefined;
        const effectiveRenderingMode = renderingMode ?? (iconColor !== undefined ? 'template' : 'original');
        if (effectiveRenderingMode === 'original') {
            return { type: 'imageSource', imageSource };
        }
        return { type: 'templateSource', templateSource: imageSource };
    }
    return undefined;
}
function convertOptionsIconToAndroidPropsIcon(icon) {
    if (icon && 'drawable' in icon && icon.drawable) {
        return {
            type: 'drawableResource',
            name: icon.drawable,
        };
    }
    if (icon && 'src' in icon && icon.src) {
        return { type: 'imageSource', imageSource: icon.src };
    }
    return undefined;
}
function convertComponentSrcToImageSource(src) {
    if ((0, children_1.isChildOfType)(src, elements_1.NativeTabsTriggerVectorIcon)) {
        const props = src.props;
        return { src: props.family.getImageSource(props.name, 24, 'white') };
    }
    else if ((0, children_1.isChildOfType)(src, elements_1.NativeTabsTriggerPromiseIcon)) {
        return { src: src.props.loader() };
    }
    else {
        console.warn('Only VectorIcon is supported as a React element in Icon.src');
    }
    return undefined;
}
//# sourceMappingURL=icon.js.map