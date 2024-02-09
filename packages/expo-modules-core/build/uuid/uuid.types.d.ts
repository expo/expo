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
    v5: (name: string, namespace: string | number[]) => string;
    namespace: typeof Uuidv5Namespace;
};
/**
 * Default namespaces for UUID v5 defined in RFC 4122
 */
export declare enum Uuidv5Namespace {
    dns = "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    url = "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
    oid = "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
    x500 = "6ba7b814-9dad-11d1-80b4-00c04fd430c8"
}
//# sourceMappingURL=uuid.types.d.ts.map