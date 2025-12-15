/** Dereference JSON schema pointers.
 *
 * @remarks
 * This is a minimal reimplementation of `json-schema-deref-sync` without
 * file reference, URL/web reference, and loader support.
 *
 * @see https://github.com/cvent/json-schema-deref-sync
 */
export declare function deref(input: any): any;
