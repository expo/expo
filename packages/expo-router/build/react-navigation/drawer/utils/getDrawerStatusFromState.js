"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDrawerStatusFromState = getDrawerStatusFromState;
function getDrawerStatusFromState(state) {
    if (state.history == null) {
        throw new Error("Couldn't find the drawer status in the state object. Is it a valid state object of drawer navigator?");
    }
    const entry = state.history.findLast((it) => it.type === 'drawer');
    return entry?.status ?? state.default ?? 'closed';
}
//# sourceMappingURL=getDrawerStatusFromState.js.map