// TODO use State from RNModule

export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; it can be used as a type and as a value
export type State = typeof State[keyof typeof State];
