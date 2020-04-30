export default class StateManager<StateType, AppliedActionResultType, ActionName extends string = never> {
    state: StateType;
    constructor(state: StateType);
    appliedActions: {
        [K in ActionName]: AppliedActionResultType;
    };
    applyAction: <NewActionName extends string>(action: (content: StateType, actions: {
        [K in ActionName]: AppliedActionResultType;
    }) => [StateType, NewActionName, AppliedActionResultType]) => StateManager<StateType, AppliedActionResultType, ActionName | NewActionName>;
}
