"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendIconOptions = appendIconOptions;
exports.convertOptionsIconToScreensPropsIcon = convertOptionsIconToScreensPropsIcon;
const materialIconConverter_1 = require("./materialIconConverter");
const optionsIconConverter_shared_1 = require("./optionsIconConverter.shared");
function appendIconOptions(options, props) {
    if ('drawable' in props && props.drawable) {
        if ('md' in props) {
            console.warn('Both `md` and `drawable` props are provided to NativeTabs.Trigger.Icon. `drawable` will take precedence on Android platform.');
        }
        options.icon = { drawable: props.drawable };
        options.selectedIcon = undefined;
    }
    else if ('md' in props && props.md) {
        if (process.env.NODE_ENV !== 'production') {
            if ('drawable' in props) {
                console.warn('Both `md` and `drawable` props are provided to NativeTabs.Trigger.Icon. `drawable` will take precedence on Android platform.');
            }
        }
        options.icon = (0, materialIconConverter_1.convertMaterialIconNameToImageSource)(props.md);
    }
    else if ('src' in props && props.src) {
        (0, optionsIconConverter_shared_1.applyIconSrcOptions)(options, props);
    }
    (0, optionsIconConverter_shared_1.applySelectedColor)(options, props.selectedColor);
}
function convertOptionsIconToScreensPropsIcon(icon) {
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
//# sourceMappingURL=optionsIconConverter.android.js.map