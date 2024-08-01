interface JestExpoMatchers<R> extends Record<string, any> {
  /**
   * Given a JSX node, flight string, or ReadableStream, this will evaluate using a constant behavior (similar to Expo Router) and compare to a string.
   *
   * @example expect(<div />).toMatchFlight('{"type":"div","props":{},"children":[]}');
   */
  toMatchFlight(expectedFlight: string): R;

  /**
   * Given a JSX node, flight string, or ReadableStream, this will evaluate using a constant behavior (similar to Expo Router) and compare to a snapshot file.
   *
   * @example expect(<div />).toMatchFlightSnapshot();
   */
  toMatchFlightSnapshot(): R;
}

// See: https://github.com/jest-community/jest-extended/blob/115ed865b9a994d9d7d6993a8700ad17091b8a4b/types/index.d.ts#L429
declare namespace jest {
  interface Matchers<R> extends JestExpoMatchers<R> {}
  interface Expect extends JestExpoMatchers<any> {}
  interface InverseAsymmetricMatchers extends Expect {}
}

// See: https://github.com/jest-community/jest-extended/blob/115ed865b9a994d9d7d6993a8700ad17091b8a4b/types/index.d.ts#L883-L886
declare module 'jest-expo' {
  const matchers: JestExpoMatchers<any>;
  export = matchers;

  // Utilities

  export function mockProperty<T = any>(module: T, propertyName: keyof T, propertyValue: any): void;
  export function unmockProperty<T = any>(module: T, propertyName: keyof T): void;
  export function unmockAllProperties(): void;
  export function mockLinking(): (eventName: string, eventData: any) => void;
}
