"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendIconOptions = appendIconOptions;
exports.convertOptionsIconToScreensPropsIcon = convertOptionsIconToScreensPropsIcon;
const optionsIconConverter_shared_1 = require("./optionsIconConverter.shared");
function appendIconOptions(options, props) {
    if ('src' in props && props.src) {
        (0, optionsIconConverter_shared_1.applyIconSrcOptions)(options, props);
    }
    (0, optionsIconConverter_shared_1.applySelectedColor)(options, props.selectedColor);
}
function convertOptionsIconToScreensPropsIcon(_icon, _iconColor) {
    return undefined;
}
//# sourceMappingURL=optionsIconConverter.js.map