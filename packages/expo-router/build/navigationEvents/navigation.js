"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNavigationOnReady = handleNavigationOnReady;
const _1 = require(".");
const store_1 = require("../global-state/store");
let unsubscribe;
function handleNavigationOnReady() {
    if (unsubscribe)
        unsubscribe();
    unsubscribe = store_1.storeRef.current.navigationRef.addListener('__unsafe_action__', (e) => {
        if (!e.data.noop && store_1.storeRef.current.state) {
            const action = e.data.action;
            (0, _1.emit)('actionDispatched', {
                actionType: action.type,
                payload: action.payload,
                state: store_1.storeRef.current.state,
            });
        }
    });
}
//# sourceMappingURL=navigation.js.map