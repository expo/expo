"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendIconOptions = appendIconOptions;
exports.convertOptionsIconToScreensPropsIcon = convertOptionsIconToScreensPropsIcon;
const optionsIconConverter_shared_1 = require("./optionsIconConverter.shared");
function appendIconOptions(options, props) {
    if ('sf' in props && props.sf) {
        if (typeof props.sf === 'string') {
            options.icon = props.sf
                ? {
                    sf: props.sf,
                }
                : undefined;
            options.selectedIcon = undefined;
        }
        else if (props.sf) {
            options.icon = props.sf.default
                ? {
                    sf: props.sf.default,
                }
                : undefined;
            options.selectedIcon = props.sf.selected
                ? {
                    sf: props.sf.selected,
                }
                : undefined;
        }
    }
    else if ('xcasset' in props && props.xcasset) {
        if (typeof props.xcasset === 'string') {
            options.icon = { xcasset: props.xcasset };
            options.selectedIcon = undefined;
        }
        else {
            options.icon = props.xcasset.default ? { xcasset: props.xcasset.default } : undefined;
            options.selectedIcon = props.xcasset.selected
                ? { xcasset: props.xcasset.selected }
                : undefined;
        }
    }
    else if ('src' in props && props.src) {
        (0, optionsIconConverter_shared_1.applyIconSrcOptions)(options, props);
    }
    (0, optionsIconConverter_shared_1.applySelectedColor)(options, props.selectedColor);
}
function convertOptionsIconToScreensPropsIcon(icon, iconColor) {
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
//# sourceMappingURL=optionsIconConverter.ios.js.map