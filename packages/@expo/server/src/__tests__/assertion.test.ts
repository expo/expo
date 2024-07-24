import { _assertNodeFetchSupport } from '../assertion';

describe(_assertNodeFetchSupport, () => {
  it(`sets up environment using default global`, () => {
    _assertNodeFetchSupport();
  });
  it(`asserts environment is missing Node.js fetch`, () => {
    expect(() => _assertNodeFetchSupport({})).toThrow(
      /Node built-in Request\/Response APIs are not available. Ensure that Node Fetch API, first available in Node.js 18, is enabled./
    );
  });
  it(`asserts environment is missing Node.js fetch`, () => {
    expect(() => _assertNodeFetchSupport({ process: { version: 'v16.12.2' } })).toThrow(
      /Node.js version 16 is not supported. Please upgrade to Node.js 20 or newer./
    );
  });
  it(`asserts node fetch is disabled manually by user`, () => {
    expect(() =>
      _assertNodeFetchSupport({
        process: {
          env: {
            NODE_OPTIONS: '--no-experimental-fetch',
          },
        },
      })
    ).toThrow(/NODE_OPTIONS/);
    expect(() =>
      _assertNodeFetchSupport({
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
      _assertNodeFetchSupport({
        process: {
          env: {
            NODE_OPTIONS: '--no-experimental-fetch',
          },
        },
        Request: {},
        Response: {},
      })
    ).not.toThrow();
  });
});
