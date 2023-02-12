export const EventType = {
  UNDETERMINED: 0,
  TOUCHES_DOWN: 1,
  TOUCHES_MOVE: 2,
  TOUCHES_UP: 3,
  TOUCHES_CANCELLED: 4,
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; it can be used as a type and as a value
export type EventType = typeof EventType[keyof typeof EventType];
