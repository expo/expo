type UUID = string;

/**
 * Collection of utilities used for generating Universally Unique Identifiers.
 */
export type Uuid = {
  /**
   * A UUID generated randomly.
   */
  v4: () => UUID;
  /**
   * A UUID generated based on the `value` and `namespace` parameters, which always produces the same result for the same inputs.
   */
  v5: (
    value: number[] | string,
    namespace: number[] | UUID,
    buf?: number[],
    offset?: number
  ) => UUID;
};
