import { createContext } from 'react';

// RNS applies the provider's top inset itself on iOS 26 with an opaque native header.
export const NativeStackTopInsetContext = createContext(false);
