// dev-client imports code that ends up using `react-native` globals, but it doesn't import `react-native` directly.
// TS therefore doesn't recognize the RN globals, which is what this is for.
/// <reference types="react-native/src/types/globals" />
