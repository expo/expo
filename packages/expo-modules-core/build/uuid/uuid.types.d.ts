/**
 * Collection of utilities used for generating Universally Unique Identifiers.
 */
export type UUID = {
    /**
     * A UUID generated randomly.
     */
    v4: () => string;
    /**
     * A UUID generated based on the `value` and `namespace` parameters, which always produces the same result for the same inputs.
     */
    v5: (value: number[] | string, namespace: number[] | string, buf?: number[], offset?: number) => string;
};
//# sourceMappingURL=uuid.types.d.ts.map