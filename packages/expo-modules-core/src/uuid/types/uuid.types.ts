export type OutputBuffer = ArrayLike<number>;
export type InputBuffer = ArrayLike<number>;

export type V4Options = { random: InputBuffer } | { rng(): InputBuffer } | string;

export type v4String = (options?: V4Options) => string;
export type v4Buffer = <T extends OutputBuffer>(
  options: V4Options | null | undefined,
  buffer: T,
  offset?: number
) => T;
export type v4 = v4Buffer & v4String;
