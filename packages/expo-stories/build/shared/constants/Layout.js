"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_native_1 = require("react-native");
exports.default = {
    window: {
        width: react_native_1.Dimensions.get('window').width,
        height: react_native_1.Dimensions.get('window').height,
    },
    isSmallDevice: react_native_1.Dimensions.get('window').width < 375,
    tabBarHeight: 65,
};
//# sourceMappingURL=Layout.js.map