import { ImmutableRequest } from '../ImmutableRequest';

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
