import { ImmutableRequest, assertRuntimeFetchAPISupport } from '../ImmutableRequest';

describe(ImmutableRequest, () => {
  let immutableRequest: ImmutableRequest;

  beforeEach(() => {
    immutableRequest = new ImmutableRequest(
      new Request('https://expo.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        },
        body: JSON.stringify({ test: 'data' }),
      })
    );
  });

  describe('passthrough properties', () => {
    it('should allow access to other safe properties', () => {
      expect(immutableRequest.url).toBe('https://expo.dev/');
      expect(immutableRequest.method).toBe('POST');
    });
  });

  describe('headers', () => {
    it('should allow reading headers', () => {
      expect(immutableRequest.headers.get('Content-Type')).toBe('application/json');
      expect(immutableRequest.headers.get('Authorization')).toBe('Bearer token');
    });

    it('should block header mutations', () => {
      expect(() => {
        // @ts-expect-error This ensures JavaScript users cannot mutate headers
        immutableRequest.headers.set('X-Custom', 'value');
      }).toThrow('This operation is not allowed on immutable headers.');

      expect(() => {
        // @ts-expect-error This ensures JavaScript users cannot mutate headers
        immutableRequest.headers.append('X-Custom', 'value');
      }).toThrow('This operation is not allowed on immutable headers.');

      expect(() => {
        // @ts-expect-error This ensures JavaScript users cannot mutate headers
        immutableRequest.headers.delete('Content-Type');
      }).toThrow('This operation is not allowed on immutable headers.');
    });
  });

  describe('body', () => {
    const expectError = (fn: () => void) => {
      expect(fn).toThrow('This operation is not allowed on immutable requests.');
    };

    it('should block access to body property', () => {
      expectError(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const body = immutableRequest.body;
      });
    });

    it('should block text() method', async () => {
      await expect(immutableRequest.text()).rejects.toThrow(
        'This operation is not allowed on immutable requests.'
      );
    });

    it('should block json() method', async () => {
      await expect(immutableRequest.json()).rejects.toThrow(
        'This operation is not allowed on immutable requests.'
      );
    });

    it('should block formData() method', async () => {
      await expect(immutableRequest.formData()).rejects.toThrow(
        'This operation is not allowed on immutable requests.'
      );
    });

    it('should block blob() method', async () => {
      await expect(immutableRequest.blob()).rejects.toThrow(
        'This operation is not allowed on immutable requests.'
      );
    });

    it('should block arrayBuffer() method', async () => {
      await expect(immutableRequest.arrayBuffer()).rejects.toThrow(
        'This operation is not allowed on immutable requests.'
      );
    });

    it('should block bytes() method', async () => {
      await expect(immutableRequest.bytes()).rejects.toThrow(
        'This operation is not allowed on immutable requests.'
      );
    });
  });

  describe('clone', () => {
    it('should return a new mutable Request when cloned', () => {
      const cloned = immutableRequest.clone();
      expect(cloned).toBeInstanceOf(Request);
      expect(cloned).not.toBe(immutableRequest);
      expect(cloned.url).toBe(immutableRequest.url);
      expect(cloned.method).toBe(immutableRequest.method);

      expect(() => {
        cloned.headers.set('X-Custom', 'value');
      }).not.toThrow();
    });
  });
});

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
