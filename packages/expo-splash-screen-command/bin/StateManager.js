"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StateManager {
    constructor(state) {
        this.state = state;
        // @ts-ignore
        this.appliedActions = {};
        // @ts-ignore
        this.applyAction = action => {
            const [state, actionName, appliedAction] = action(this.state, this.appliedActions);
            this.state = state;
            // @ts-ignore
            this.appliedActions[actionName] = appliedAction;
            return this;
        };
    }
}
exports.default = StateManager;
//# sourceMappingURL=StateManager.js.map