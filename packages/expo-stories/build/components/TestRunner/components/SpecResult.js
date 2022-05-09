"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var Colors_1 = __importDefault(require("../constants/Colors"));
var StatusEmojis_1 = __importDefault(require("../constants/StatusEmojis"));
var Statuses_1 = __importDefault(require("../constants/Statuses"));
function getStatusEmoji(status) {
    if (status in StatusEmojis_1.default) {
        return StatusEmojis_1.default[status];
    }
    return getStatusEmoji(Statuses_1.default.Disabled);
}
function SpecResult(_a) {
    var _b = _a.status, status = _b === void 0 ? Statuses_1.default.Running : _b, description = _a.description, failedExpectations = _a.failedExpectations;
    var renderExpectations = react_1.default.useMemo(function () { return function (e, i) {
        return (react_1.default.createElement(react_native_1.Text, { testID: "test_suite_text_spec_exception", key: i }, e.get('message')));
    }; }, []);
    var borderColor = Colors_1.default[status];
    var message = "".concat(getStatusEmoji(status), " ").concat(description, " (").concat(status, ")");
    return (react_1.default.createElement(react_native_1.View, { testID: "test_suite_view_spec_container", style: [
            styles.container,
            {
                borderColor: borderColor,
            },
        ] },
        react_1.default.createElement(react_native_1.Text, { testID: "test_suite_text_spec_description", style: styles.text }, message),
        failedExpectations.map(renderExpectations)));
}
exports.default = SpecResult;
var styles = react_native_1.StyleSheet.create({
    container: {
        paddingLeft: 10,
        marginVertical: 3,
        borderLeftWidth: 3,
    },
    text: {
        fontSize: 16,
    },
});
//# sourceMappingURL=SpecResult.js.map