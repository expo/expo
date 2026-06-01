"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStandardActions = useStandardActions;
const react_1 = require("react");
function useStandardActions(navigation) {
    return (0, react_1.useMemo)(() => ({
        back: () => {
            navigation.dispatch({ type: 'GO_BACK' });
        },
        navigate: (name, params) => {
            navigation.dispatch({
                type: 'NAVIGATE',
                payload: { name, params },
            });
        },
    }), [navigation]);
}
//# sourceMappingURL=useStandardActions.js.map