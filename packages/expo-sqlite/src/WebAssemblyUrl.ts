import ExpoSQLite from './ExpoSQLite';

/**
 * Sets the URL of a custom wa-sqlite WebAssembly build, for example one built with FTS enabled.
 * Call it before opening any database. Has no effect on Android and iOS.
 *
 * The build must come from the same [`expo/wa-sqlite`](https://github.com/expo/wa-sqlite) revision that this version of `expo-sqlite` uses.
 *
 * @param url The URL of the `.wasm` file, such as the value of `import wasmUrl from './wa-sqlite.wasm'`.
 * @platform web
 */
export function setWebAssemblyUrl(url: string): void {
  // Only the browser web module implements it. Native and server rendering ignore the call.
  ExpoSQLite.setWebAssemblyUrl?.(url);
}
