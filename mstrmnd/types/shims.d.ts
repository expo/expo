declare module '@ungap/structured-clone' {
  const structuredClone: <T>(value: T) => T;
  export default structuredClone;
}

declare module 'react-native/Libraries/Utilities/PolyfillFunctions' {
  export function polyfillGlobal(name: string, getValue: () => unknown): void;
}
