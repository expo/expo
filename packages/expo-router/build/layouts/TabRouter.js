"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabRouterOverride = void 0;
const tabRouterOverride = (original) => {
    return {
        ...original,
        getStateForAction: (state, action, options) => {
            if (action.target && action.target !== state.key) {
                return null;
            }
            if (isReplaceAction(action)) {
                // Generate the state as if we were using JUMP_TO
                let nextState = original.getStateForAction(state, {
                    ...action,
                    type: 'JUMP_TO',
                }, options);
                if (!nextState || nextState.index === undefined || !Array.isArray(nextState.history)) {
                    return null;
                }
                // If the state is valid and we didn't JUMP_TO a single history state,
                // then remove the previous state.
                if (nextState.index !== 0) {
                    const previousIndex = nextState.index - 1;
                    nextState = {
                        ...nextState,
                        key: `${nextState.key}-replace`,
                        // Omit the previous history entry that we are replacing
                        history: [
                            ...nextState.history.slice(0, previousIndex),
                            ...nextState.history.splice(nextState.index),
                        ],
                    };
                }
                return nextState;
            }
            return original.getStateForAction(state, action, options);
        },
    };
};
exports.tabRouterOverride = tabRouterOverride;
function isReplaceAction(action) {
    return action.type === 'REPLACE';
}
//# sourceMappingURL=TabRouter.js.map