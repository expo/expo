"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var googleIcon = {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/200px-Google_%22G%22_Logo.svg.png',
};
var GoogleSignInButton = /** @class */ (function (_super) {
    __extends(GoogleSignInButton, _super);
    function GoogleSignInButton() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GoogleSignInButton.prototype.render = function () {
        var _a = this.props, children = _a.children, style = _a.style, disabled = _a.disabled, props = __rest(_a, ["children", "style", "disabled"]);
        return (react_1.default.createElement(react_native_1.TouchableOpacity, __assign({ disabled: disabled, activeOpacity: 0.6, style: react_native_1.StyleSheet.flatten([styles.touchable, style]) }, props),
            react_1.default.createElement(react_native_1.View, { style: styles.content },
                react_1.default.createElement(react_native_1.Image, { source: googleIcon, style: styles.icon }),
                react_1.default.createElement(react_native_1.Text, { style: styles.text }, children))));
    };
    GoogleSignInButton.defaultProps = {
        onPress: function () { },
    };
    return GoogleSignInButton;
}(react_1.default.PureComponent));
exports.default = GoogleSignInButton;
var styles = react_native_1.StyleSheet.create({
    touchable: {
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        shadowOffset: { width: 0, height: 1 },
        overflow: 'visible',
        shadowColor: 'black',
        backgroundColor: 'white',
        borderRadius: 4,
    },
    content: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    icon: { width: 24, aspectRatio: 1 },
    text: { color: 'gray', marginLeft: 12, fontSize: 16, fontWeight: '600' },
});
//# sourceMappingURL=GoogleSignInButton.js.map