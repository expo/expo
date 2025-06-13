"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkPreviewNativeActionView = exports.LinkPreviewNativeTriggerView = exports.LinkPreviewNativePreviewView = exports.LinkPreviewNativeView = void 0;
const react_native_1 = require("react-native");
const NotAvailableOnThisPlatformComponent = () => {
    console.warn('Peek and pop preview is only available on iOS');
    return <react_native_1.Text style={{ color: 'red' }}>Peek and pop preview is only available on iOS</react_native_1.Text>;
};
const LinkPreviewNativeView = (_) => NotAvailableOnThisPlatformComponent();
exports.LinkPreviewNativeView = LinkPreviewNativeView;
const LinkPreviewNativePreviewView = (_) => NotAvailableOnThisPlatformComponent();
exports.LinkPreviewNativePreviewView = LinkPreviewNativePreviewView;
const LinkPreviewNativeTriggerView = (_) => NotAvailableOnThisPlatformComponent();
exports.LinkPreviewNativeTriggerView = LinkPreviewNativeTriggerView;
const LinkPreviewNativeActionView = (_) => NotAvailableOnThisPlatformComponent();
exports.LinkPreviewNativeActionView = LinkPreviewNativeActionView;
//# sourceMappingURL=index.js.map