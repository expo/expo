import { assertRuntimeFetchAPISupport } from '../ImmutableRequest';

describe(assertRuntimeFetchAPISupport, () => {
  it(`sets up environment using default global`, () => {
    assertRuntimeFetchAPISupport();
  });
  it(`asserts environment is missing Node.js fetch`, () => {
    expect(() => assertRuntimeFetchAPISupport({})).toThrow(
      /Runtime built-in Request\/Response\/Headers APIs are not available. If running Node ensure that Node Fetch API, first available in Node.js 18, is enabled./
    );
  });
  it(`asserts environment is missing Node.js fetch`, () => {
    expect(() => assertRuntimeFetchAPISupport({ process: { version: 'v16.12.2' } })).toThrow(
      /Node.js version 16 is not supported. Upgrade to Node.js 20 or newer./
    );
  });
  it(`asserts node fetch is disabled manually by user`, () => {
    expect(() =>
      assertRuntimeFetchAPISupport({
        process: {
          env: {
            NODE_OPTIONS: '--no-experimental-fetch',
          },
        },
      })
    ).toThrow(/NODE_OPTIONS/);
    expect(() =>
      assertRuntimeFetchAPISupport({
        process: {
          env: {
            NODE_OPTIONS: '--foo --no-experimental-fetch',
          },
        },
      })
    ).toThrow(/NODE_OPTIONS/);
  });
  it(`experimental fetch can be disabled with error skipped when globals are polyfilled`, () => {
    expect(() =>
      assertRuntimeFetchAPISupport({
        process: {
          env: {
            NODE_OPTIONS: '--no-experimental-fetch',
          },
        },
        Request: {},
        Response: {},
        Headers: {},
      })
    ).not.toThrow();
  });
});
