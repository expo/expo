export default class StateManager<
  StateType,
  AppliedActionResultType,
  ActionName extends string = never
> {
  constructor(public state: StateType) {}
  // @ts-ignore
  appliedActions: { [K in ActionName]: AppliedActionResultType } = {};
  // @ts-ignore
  applyAction: <NewActionName extends string>(
    action: (
      content: StateType,
      actions: { [K in ActionName]: AppliedActionResultType }
    ) => [StateType, NewActionName, AppliedActionResultType]
  ) => StateManager<StateType, AppliedActionResultType, ActionName | NewActionName> = action => {
    const [state, actionName, appliedAction] = action(this.state, this.appliedActions);
    this.state = state;
    // @ts-ignore
    this.appliedActions[actionName] = appliedAction;
    return this;
  };
}
