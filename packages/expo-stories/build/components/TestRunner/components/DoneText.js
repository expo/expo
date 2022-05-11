"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
function DoneText(_a) {
    var done = _a.done, numFailed = _a.numFailed, results = _a.results;
    return (react_1.default.createElement(react_native_1.View, { testID: "test_suite_results", style: styles.container },
        !done && (react_1.default.createElement(react_native_1.Text, { testID: "test_suite_loading_results", style: styles.doneMessage }, "Running Tests...")),
        done && (react_1.default.createElement(react_native_1.Text, { testID: "test_suite_text_results", style: styles.doneMessage },
            "Complete: ",
            numFailed,
            numFailed === 1 ? ' test' : ' tests',
            " failed.")),
        done && (react_1.default.createElement(react_native_1.View, { pointerEvents: "none" },
            react_1.default.createElement(react_native_1.Text, { style: styles.finalResults, testID: "test_suite_final_results" }, results)))));
}
exports.default = DoneText;
var styles = react_native_1.StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    finalResults: {
        // Hide text for Detox to read
        position: 'absolute',
        opacity: 0,
    },
    doneMessage: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});
//# sourceMappingURL=DoneText.js.map