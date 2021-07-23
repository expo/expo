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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var MaterialCommunityIcons_1 = __importDefault(require("@expo/vector-icons/build/MaterialCommunityIcons"));
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var Colors_1 = __importDefault(require("../constants/Colors"));
var TabIcon = /** @class */ (function (_super) {
    __extends(TabIcon, _super);
    function TabIcon() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TabIcon.prototype.render = function () {
        var _a = this.props, _b = _a.size, size = _b === void 0 ? 27 : _b, name = _a.name, focused = _a.focused;
        var color = focused ? Colors_1.default.tabIconSelected : Colors_1.default.tabIconDefault;
        var platformSize = react_native_1.Platform.select({
            ios: size,
            default: size - 2,
        });
        return react_1.default.createElement(MaterialCommunityIcons_1.default, { name: name, size: platformSize, color: color });
    };
    return TabIcon;
}(react_1.default.PureComponent));
exports.default = TabIcon;
//# sourceMappingURL=TabIcon.js.map