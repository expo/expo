"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LinkPreviewNativePreviewNativeView;
const expo_1 = require("expo");
const react_1 = require("react");
const NativeView = (0, expo_1.requireNativeView)('ExpoRouterLinkPreviewNative', 'LinkPreviewNativePreviewView');
function LinkPreviewNativePreviewNativeView(props) {
    // TODO: Replace with proper yoga styling
    const [previewSize, setPreviewSize] = (0, react_1.useState)(undefined);
    const customStyle = {
        position: 'absolute',
        width: previewSize?.width,
        height: previewSize?.height,
    };
    const style = Array.isArray(props.style)
        ? [...props.style, customStyle]
        : [props.style, customStyle];
    return (<NativeView {...props} onSetSize={({ nativeEvent: size }) => setPreviewSize(size)} style={style}/>);
}
//# sourceMappingURL=LinkPreviewNativePreviewView.js.map