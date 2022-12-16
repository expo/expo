"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var expo_constants_1 = __importDefault(require("expo-constants"));
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var DoneText_1 = __importDefault(require("./DoneText"));
var SuiteResult_1 = __importDefault(require("./SuiteResult"));
function Suites(_a) {
    var suites = _a.suites, done = _a.done, numFailed = _a.numFailed, results = _a.results;
    var ref = react_1.default.useRef(null);
    var renderItem = function (_a) {
        var item = _a.item;
        return react_1.default.createElement(SuiteResult_1.default, { r: item, depth: 0 });
    };
    var keyExtractor = function (item) { return item.get('result').get('id'); };
    var scrollToEnd = react_1.default.useMemo(function () { return function () {
        // @ts-ignore
        if (ref.current)
            ref.current.scrollToEnd({ animated: false });
    }; }, [ref]);
    react_1.default.useEffect(function () {
        if (done && ref.current) {
            scrollToEnd();
        }
    }, [ref, done]);
    var ListFooterComponent = function () { return (react_1.default.createElement(DoneText_1.default, { done: done, numFailed: numFailed, results: results })); };
    return (react_1.default.createElement(react_native_1.FlatList, { ref: ref, style: styles.list, contentContainerStyle: styles.contentContainerStyle, data: __spreadArray([], suites, true), keyExtractor: keyExtractor, renderItem: renderItem, ListFooterComponent: ListFooterComponent, onContentSizeChange: scrollToEnd, onLayout: scrollToEnd }));
}
exports.default = Suites;
var styles = react_native_1.StyleSheet.create({
    contentContainerStyle: {
        padding: 5,
        paddingBottom: (expo_constants_1.default.statusBarHeight || 24) + 128,
    },
    list: {
        flex: 1,
    },
});
//# sourceMappingURL=Suites.js.map