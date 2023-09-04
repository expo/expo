type UUID = string;

/**
 * Collection of functions used for generating Universally Unique Identifiers.
 */
export type Uuid = {
  /**
   * A UUID generated based on the `value` and `namespace` parameters, which always gives the same result for the same inputs.
   */
  v5: (name: string, namespace: Uuidv5Namespace | UUID) => UUID;
  namespace: typeof Uuidv5Namespace;
};

/**
 * Default namespaces for UUID v5 defined in RFC 4122
 */
export enum Uuidv5Namespace {
  // Source of the UUIDs: https://datatracker.ietf.org/doc/html/rfc4122
  dns = '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  url = '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  oid = '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  x500 = '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
}
