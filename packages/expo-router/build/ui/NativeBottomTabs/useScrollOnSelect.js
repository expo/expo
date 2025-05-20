"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScrollOnSelect = useScrollOnSelect;
const react_1 = require("react");
function useScrollOnSelect({ navigation, topInset }) {
    const [isFocused, setIsFocused] = (0, react_1.useState)(false);
    const scrollViewRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const handleTabSelected = () => {
            if (isFocused && scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: -topInset, animated: true });
            }
        };
        navigation.addListener('tabSelected', handleTabSelected);
        return () => {
            navigation.removeListener('tabSelected', handleTabSelected);
        };
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