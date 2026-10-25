type ExistingStateType<State> = State extends { type?: infer Type extends string }
  ? NonNullable<Type>
  : never;

type StateWithType<State extends object, Type extends string> = State & {
  type: ExistingStateType<State> | Type;
};

// TODO(@ubax): align this type with router.type
export function ensureStateType<State extends object, Type extends string>(
  state: State & { type?: string },
  type: Type
): StateWithType<State, Type> {
  if (state.type != null) {
    // The null check guarantees the optional property required by the return type.
    return state as StateWithType<State, Type>;
  }

  return { ...state, type };
}
