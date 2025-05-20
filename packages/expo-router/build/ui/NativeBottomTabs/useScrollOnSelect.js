"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScrollOnSelect = useScrollOnSelect;
const elements_1 = require("@react-navigation/elements");
const react_1 = require("react");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const useOnTabSelect_1 = require("./useOnTabSelect");
function useScrollOnSelect(args) {
    const { noInset, withHeader } = args ?? {};
    const scrollViewRef = (0, react_1.useRef)(null);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const headerHeight = withHeader && elements_1.HeaderHeightContext ? ((0, react_1.use)(elements_1.HeaderHeightContext) ?? 0) : 0;
    const topInset = noInset ? 0 : withHeader ? headerHeight : insets.top;
    const onTabSelect = (0, react_1.useCallback)(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: -topInset, animated: true });
        }
    }, [scrollViewRef, topInset]);
    (0, useOnTabSelect_1.useOnTabSelect)(onTabSelect);
    return {
        scrollViewRef,
    };
}
//# sourceMappingURL=useScrollOnSelect.js.map