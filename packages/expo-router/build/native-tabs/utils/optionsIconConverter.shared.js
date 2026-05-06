"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyIconSrcOptions = applyIconSrcOptions;
exports.applySelectedColor = applySelectedColor;
const react_1 = require("react");
const icon_1 = require("./icon");
function applyIconSrcOptions(options, props) {
    const icon = convertIconSrcToIconOption(props);
    options.icon = icon?.icon;
    options.selectedIcon = icon?.selectedIcon;
}
function applySelectedColor(options, selectedColor) {
    if (selectedColor) {
        options.selectedIconColor = selectedColor;
    }
}
function convertIconSrcToIconOption(icon) {
    if (icon && icon.src) {
        const { defaultIcon, selected } = typeof icon.src === 'object' && 'selected' in icon.src
            ? { defaultIcon: icon.src.default, selected: icon.src.selected }
            : { defaultIcon: icon.src };
        const options = {};
        options.icon = convertSrcOrComponentToSrc(defaultIcon, { renderingMode: icon.renderingMode });
        options.selectedIcon = convertSrcOrComponentToSrc(selected, {
            renderingMode: icon.renderingMode,
        });
        return options;
    }
    return undefined;
}
function convertSrcOrComponentToSrc(src, options) {
    if (src) {
        if ((0, react_1.isValidElement)(src)) {
            return (0, icon_1.convertComponentSrcToImageSource)(src, options.renderingMode);
        }
        else {
            return { src, renderingMode: options.renderingMode };
        }
    }
    return undefined;
}
//# sourceMappingURL=optionsIconConverter.shared.js.map