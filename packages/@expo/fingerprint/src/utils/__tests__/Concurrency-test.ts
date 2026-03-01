import { createLimiter } from '../Concurrency';

const withResolvers = <T = void>() => {
  let resolve: (value: T) => void;
  const promise = new Promise<T>((_resolve) => {
    resolve = _resolve;
  });
  return {
    promise,
    resolve(value: T): Promise<void> {
      resolve(value);
      return promise.then(() => Promise.resolve());
    },
  };
};

describe(createLimiter, () => {
  it('limits concurrent executions', async () => {
    const a = withResolvers();
    const b = withResolvers();
    const c = withResolvers();
    const d = withResolvers();

    const limit = createLimiter(2);
    const started: string[] = [];
    const stopped: string[] = [];

    limit(async () => {
      started.push('a');
      await a.promise;
      stopped.push('a');
    });
    limit(async () => {
      started.push('b');
      await b.promise;
      stopped.push('b');
    });
    limit(async () => {
      started.push('c');
      await c.promise;
      stopped.push('c');
    });
    limit(async () => {
      started.push('d');
      await d.promise;
      stopped.push('d');
    });

    expect(started).toEqual(['a', 'b']);
    expect(stopped).toEqual([]);

    await a.resolve();
    expect(stopped).toEqual(['a']);

    await c.resolve();
    expect(started).toEqual(['a', 'b', 'c', 'd']);
    expect(stopped).toEqual(['a', 'c']);

    await b.resolve();
    expect(stopped).toEqual(['a', 'c', 'b']);

    await d.resolve();
    expect(stopped).toEqual(['a', 'c', 'b', 'd']);

    await limit(async () => {
      stopped.push('e');
    });

    expect(stopped).toEqual(['a', 'c', 'b', 'd', 'e']);
  });
});
