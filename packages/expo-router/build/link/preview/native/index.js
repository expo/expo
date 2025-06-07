"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeekAndPopTriggerView = exports.PeekAndPopPreviewView = exports.PeekAndPopView = void 0;
const react_native_1 = require("react-native");
const NotAvailableOnThisPlatformComponent = () => {
    console.warn('Peek and pop preview is only available on iOS');
    return <react_native_1.Text style={{ color: 'red' }}>Peek and pop preview is only available on iOS</react_native_1.Text>;
};
const PeekAndPopView = (_) => NotAvailableOnThisPlatformComponent();
exports.PeekAndPopView = PeekAndPopView;
const PeekAndPopPreviewView = (_) => NotAvailableOnThisPlatformComponent();
exports.PeekAndPopPreviewView = PeekAndPopPreviewView;
const PeekAndPopTriggerView = (_) => NotAvailableOnThisPlatformComponent();
exports.PeekAndPopTriggerView = PeekAndPopTriggerView;
//# sourceMappingURL=index.js.map