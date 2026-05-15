/**
 * @hidden
 * Compatibility barrel for older deep imports. New source files should import
 * public types from `FileSystem.types` or the relevant domain type file, and
 * native-only declarations from `internal/NativeFileSystem.types`.
 */
export * from './FileSystem.types';
export * from './internal/NativeFileSystem.types';
