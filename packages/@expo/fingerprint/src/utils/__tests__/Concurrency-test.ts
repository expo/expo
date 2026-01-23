import { createLimiter } from '../Concurrency';

const withResolvers = <T = void>() => {
  let resolve: (value: T) => void;
  let reject: (value: T) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve(value: T) {
      resolve(value);
    },
    reject(error: any) {
      reject(error);
    },
  };
};

describe(createLimiter, () => {
  it('limits concurrent executions', async () => {
    const a = withResolvers();
    const b = withResolvers();
    const c = withResolvers();

    const limit = createLimiter(2);
    const seen: string[] = [];

    const aOut = limit(async () => {
      await a.promise;
      seen.push('a');
    });
    const bOut = limit(async () => {
      await b.promise;
      seen.push('b');
    });
    const cOut = limit(async () => {
      await c.promise;
      seen.push('c');
    });

    expect(seen).toEqual([]);
    a.resolve();
    c.resolve(); // resolve early but is queued
    await aOut;
    expect(seen).toEqual(['a']);
    b.resolve();
    await bOut;
    expect(seen).toEqual(['a', 'b', 'c']);
    await cOut;
  });
});
