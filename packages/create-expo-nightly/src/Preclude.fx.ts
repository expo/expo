import { fileURLToPath } from 'node:url';

/**
 * Workaround mixed ESM/CJS imports for ncc/webpack.
 * The __filename is referenced from the `write-file-atomic` packages.
 * This is a workaround to predefine the `__filename` global variable.
 * The `import.meta.url` is the current file path, but after ncc bundled all the files into one, the path will be correct.
 */
globalThis.__filename = fileURLToPath(import.meta.url);
