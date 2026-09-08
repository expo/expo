import { createContext } from 'react';

/**
 * Name of the enclosing FunctionDemo. Scopes accessibility labels of its controls,
 * e.g. `aesEncryptAsync: plaintext`, so e2e tools can target one demo among many.
 */
export const FunctionNameContext = createContext('');
