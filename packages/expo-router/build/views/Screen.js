"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Screen = void 0;
const react_1 = __importDefault(require("react"));
const useDeprecated_1 = require("../useDeprecated");
const useNavigation_1 = require("../useNavigation");
const useLayoutEffect = typeof window !== 'undefined' ? react_1.default.useLayoutEffect : function () { };
/** Component for setting the current screen's options dynamically. */
function Screen({ name, redirect, options, }) {
    const navigation = (0, useNavigation_1.useNavigation)(name);
    useLayoutEffect(() => {
        if (options &&
            // React Navigation will infinitely loop in some cases if an empty object is passed to setOptions.
            // https://github.com/expo/router/issues/452
            Object.keys(options).length) {
            navigation.setOptions(options);
        }
    }, [navigation, options]);
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        (0, useDeprecated_1.useDeprecated)('The `redirect` prop on <Screen /> is deprecated and will be removed. Please use `router.redirect` instead', redirect);
    }
    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        react_1.default.useEffect(() => {
            if (redirect != null) {
                throw new Error('Screen components should only use the `redirect` prop when nested directly inside a Layout component.');
            }
        }, [name, redirect]);
    }
    return null;
}
exports.Screen = Screen;
//# sourceMappingURL=Screen.js.map