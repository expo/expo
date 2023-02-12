"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var SpecResult_1 = __importDefault(require("./SpecResult"));
function SuiteResult(_a) {
    var r = _a.r, depth = _a.depth;
    var renderSpecResult = react_1.default.useMemo(function () { return function (r) {
        var status = r.get('status');
        var key = r.get('id');
        var description = r.get('description');
        var failedExpectations = r.get('failedExpectations');
        return (react_1.default.createElement(SpecResult_1.default, { key: "spec-result-".concat(key), status: status, description: description, failedExpectations: failedExpectations }));
    }; }, []);
    var renderSuiteResult = react_1.default.useMemo(function () { return function (r) { return react_1.default.createElement(SuiteResult, { key: r.get('result').get('id'), r: r, depth: depth + 1 }); }; }, [depth]);
    var result = r.get('result');
    var description = result.get('description');
    var specs = r.get('specs');
    var children = r.get('children');
    var titleStyle = depth === 0 ? styles.titleParent : styles.titleChild;
    var containerStyle = depth === 0 ? styles.containerParent : styles.containerChild;
    return (react_1.default.createElement(react_native_1.View, { testID: "test_suite_view_suite_container", style: containerStyle },
        react_1.default.createElement(react_native_1.Text, { testID: "test_suite_text_suite_description", style: titleStyle }, description),
        specs.map(renderSpecResult),
        children.map(renderSuiteResult)));
}
exports.default = SuiteResult;
var styles = react_native_1.StyleSheet.create({
    containerParent: {
        paddingLeft: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    containerChild: {
        paddingLeft: 16,
    },
    titleParent: {
        marginBottom: 8,
        fontSize: 16,
        fontWeight: 'bold',
    },
    titleChild: {
        marginVertical: 8,
        fontSize: 16,
    },
});
//# sourceMappingURL=SuiteResult.js.map