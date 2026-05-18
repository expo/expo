import { createMemoizer, memoize, _verifyMemoizerFreed } from '../memoize';

it('provides cached value for memoizer', async () => {
  const memoizer = createMemoizer();

  let num = 0;
  const fn = memoize(async () => ++num);

  await memoizer.withMemoizer(async () => {
    expect(await fn('test')).toBe(1);
    expect(await fn('test')).toBe(1);
    expect(num).toBe(1);
    // Busts cache
    expect(await fn('test-2')).toBe(2);
    expect(await fn('test-2')).toBe(2);
    expect(num).toBe(2);
  });

  expect(_verifyMemoizerFreed()).toBe(true);
});

it('allows uncached calls', async () => {
  // NOTE: This is to mute the `console.warn` log
  process.env.NODE_ENV = 'not-test';

  let num = 0;
  const fn = memoize(async () => ++num);

  expect(await fn('test')).toBe(1);
  expect(await fn('test')).toBe(2);
  expect(num).toBe(2);

  expect(_verifyMemoizerFreed()).toBe(true);
});

it('allows direct calls without async context', async () => {
  const memoizer = createMemoizer();

  let num = 0;
  const fn = memoize(async () => ++num);

  expect(await memoizer.call(fn, 'test')).toBe(1);
  expect(await memoizer.call(fn, 'test')).toBe(1);
  expect(num).toBe(1);

  expect(_verifyMemoizerFreed()).toBe(true);
});
