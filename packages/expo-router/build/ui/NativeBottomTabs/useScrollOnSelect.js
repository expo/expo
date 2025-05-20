"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScrollOnSelect = useScrollOnSelect;
const elements_1 = require("@react-navigation/elements");
const react_1 = require("react");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const useNavigation_1 = require("../../useNavigation");
function useScrollOnSelect(args) {
    const { noInset, withHeader } = args ?? {};
    const [isFocused, setIsFocused] = (0, react_1.useState)(false);
    const scrollViewRef = (0, react_1.useRef)(null);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const headerHeight = withHeader && elements_1.HeaderHeightContext ? ((0, react_1.use)(elements_1.HeaderHeightContext) ?? 0) : 0;
    const topInset = noInset ? 0 : withHeader ? headerHeight : insets.top;
    const navigation = (0, useNavigation_1.useNavigation)();
    (0, react_1.useEffect)(() => {
        let tabNavigation = navigation;
        while (tabNavigation && tabNavigation.getState()?.type !== 'tab') {
            tabNavigation = tabNavigation.getParent();
        }
        if (!tabNavigation) {
            return;
        }
        const unsubscribe = tabNavigation.addListener('tabSelected', () => {
            if (isFocused && scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: -topInset, animated: true });
            }
        });
        return unsubscribe;
    }, [navigation, isFocused, scrollViewRef, topInset]);
    (0, react_1.useEffect)(() => {
        const handleFocused = () => {
            setIsFocused(true);
        };
        const handleBlured = () => {
            setIsFocused(false);
        };
        navigation.addListener('blur', handleBlured);
        navigation.addListener('focus', handleFocused);
        return () => {
            navigation.removeListener('blur', handleBlured);
            navigation.removeListener('focus', handleFocused);
        };
    }, [navigation]);
    return {
        scrollViewRef,
    };
}
//# sourceMappingURL=useScrollOnSelect.js.map