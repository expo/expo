export const Directions = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; it can be used as a type and as a value
export type Directions = typeof Directions[keyof typeof Directions];
