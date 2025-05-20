"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOnTabSelect = useOnTabSelect;
const react_1 = require("react");
const useNavigation_1 = require("../../useNavigation");
function useOnTabSelect(callback) {
    const [isFocused, setIsFocused] = (0, react_1.useState)(false);
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
            if (isFocused) {
                callback();
            }
        });
        return unsubscribe;
    }, [navigation, isFocused, callback]);
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
}
//# sourceMappingURL=useOnTabSelect.js.map