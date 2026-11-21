/** A value that can be sent as JSON without changing its TypeScript type. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

// Interfaces have no implicit index signature, so check their properties individually.
type JsonInput<T> = T extends JsonValue
  ? T
  : T extends (...args: never[]) => unknown
    ? never
    : T extends object
      ? { [K in keyof T]: JsonInput<T[K]> }
      : never;

/** A standard `Response` that preserves the type of its JSON body. */
export type TypedResponse<T> = Omit<Response, 'json' | 'clone'> & {
  json(): Promise<T>;
  clone(): TypedResponse<T>;
};

/**
 * Creates a JSON response while preserving the type of its body.
 * Pass JSON values only. Convert values such as `Date` to strings before calling this helper.
 *
 * @example
 * ```ts
 * import { json } from 'expo-server';
 *
 * export function loader() {
 *   return json({ name: 'Ada' }, {
 *     headers: { 'Cache-Control': 'private, max-age=60' },
 *   });
 * }
 * ```
 */
export function json<T>(data: T & JsonInput<T>, init?: ResponseInit): TypedResponse<T> {
  // The input is restricted to JSON values, so parsing the body preserves its type.
  return Response.json(data, init) as TypedResponse<T>;
}
