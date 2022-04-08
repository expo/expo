declare module 'json-schema-deref-sync' {
  interface Options {
    /**
     * The base folder to get relative path files from.
     * @default process.cwd()
     */
    baseFolder?: string;

    /**
     * By default missing / unresolved refs will be left as is with their ref value intact.
     * If set to true we will error out on first missing ref that we cannot resolve.
     *
     * @default false
     */
    failOnMissing?: boolean;

    /**
     * By default properties in a object with $ref will be removed in the output.
     * If set to true they will be added/overwrite the output.
     * This will use `lodash`'s merge function.
     *
     * @default false
     */
    mergeAdditionalProperties?: boolean;

    /**
     * By default `$id` fields will get copied when dereferencing.
     * If set to true they will be removed.
     * Merged properties will not get removed.
     *
     * @default false
     */
    removeIds?: boolean;

    /**
     * A hash mapping reference types (e.g., 'file') to loader functions.
     */
    loaders?: Record<string, Function>;
  }

  export default function deref(schema: object, options?: object): object | Error;
}
