declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Given a JSX node, flight string, or ReadableStream, this will evaluate using a constant behavior (similar to Expo Router) and compare to a string.
       *
       * @example
       * expect(<div />).toMatchFlight('{"type":"div","props":{},"children":[]}');
       *
       */
      toMatchFlight(data: string): R;

      /**
       * Given a JSX node, flight string, or ReadableStream, this will evaluate using a constant behavior (similar to Expo Router) and compare to a snapshot file.
       *
       * @example
       * expect(<div />).toMatchFlightSnapshot();
       *
       */
      toMatchFlightSnapshot(): R;
    }
  }
}

export {};
