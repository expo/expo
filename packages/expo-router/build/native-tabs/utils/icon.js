import { useEffect, useMemo, useState } from 'react';
import { isChildOfType } from '../../utils/children';
import { NativeTabsTriggerPromiseIcon, NativeTabsTriggerVectorIcon } from '../common/elements';
export function convertIconColorPropToObject(iconColor) {
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
export function useAwaitedScreensIcon(icon) {
    const src = icon && typeof icon === 'object' && 'src' in icon ? icon.src : undefined;
    const renderingMode = icon && typeof icon === 'object' && 'renderingMode' in icon ? icon.renderingMode : undefined;
    const [awaitedIcon, setAwaitedIcon] = useState(undefined);
    useEffect(() => {
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
    return useMemo(() => {
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
export function convertOptionsIconToRNScreensPropsIcon(icon, iconColor) {
    if (!icon) {
        return undefined;
    }
    return {
        ios: convertOptionsIconToIOSPropsIcon(icon, iconColor),
        android: convertOptionsIconToAndroidPropsIcon(icon),
    };
}
export function convertOptionsIconToIOSPropsIcon(icon, iconColor) {
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
export function convertOptionsIconToAndroidPropsIcon(icon) {
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
export function convertComponentSrcToImageSource(src, renderingMode) {
    let result;
    if (isChildOfType(src, NativeTabsTriggerVectorIcon)) {
        const props = src.props;
        result = { src: props.family.getImageSource(props.name, 24, 'white') };
    }
    else if (isChildOfType(src, NativeTabsTriggerPromiseIcon)) {
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