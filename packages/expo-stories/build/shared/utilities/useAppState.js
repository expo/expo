"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
function useAppState(initialState) {
    if (initialState === void 0) { initialState = react_native_1.AppState.currentState; }
    var _a = react_1.useState(initialState), state = _a[0], setState = _a[1];
    react_1.useEffect(function () {
        react_native_1.AppState.addEventListener('change', setState);
        return function () { return react_native_1.AppState.removeEventListener('change', setState); };
    }, []);
    return state;
}
exports.default = useAppState;
//# sourceMappingURL=useAppState.js.map