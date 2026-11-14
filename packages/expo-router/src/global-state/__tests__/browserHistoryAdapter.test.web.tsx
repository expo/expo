/** @jest-environment node */
import { reset, window as stubWindow } from '../../fork/__stubs__/window';
import { createBrowserHistoryAdapter } from '../browserHistoryAdapter';

const originalDescriptors: Record<string, PropertyDescriptor | undefined> = {};

beforeEach(() => {
  reset();
  // Save original descriptors and override globals with the stub
  for (const key of Object.keys(stubWindow) as (keyof typeof stubWindow)[]) {
    originalDescriptors[key] = Object.getOwnPropertyDescriptor(global, key);
    Object.defineProperty(global, key, {
      get: () => stubWindow[key],
      configurable: true,
    });
  }
});

afterEach(() => {
  jest.restoreAllMocks();
  // Restore original globals to avoid corrupting jsdom
  for (const key of Object.keys(stubWindow) as (keyof typeof stubWindow)[]) {
    const original = originalDescriptors[key];
    if (original) {
      Object.defineProperty(global, key, original);
    } else {
      delete (global as any)[key];
    }
  }
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

test('runs commands in order and does not report its own traversal', async () => {
  const adapter = createBrowserHistoryAdapter();
  const listener = jest.fn();
  adapter.listen(listener);

  adapter.apply({ type: 'browser-history', op: 'replace', entryId: 'a', path: '/a' });
  adapter.apply({ type: 'browser-history', op: 'push', entryId: 'b', path: '/b' });
  adapter.apply({ type: 'browser-history', op: 'push', entryId: 'c', path: '/c' });
  adapter.apply({ type: 'browser-history', op: 'go', delta: -2 });
  adapter.apply({ type: 'browser-history', op: 'replace', entryId: 'a', path: '/a?x=1' });
  await settle();

  expect(stubWindow.history.state).toEqual({ id: 'a' });
  expect(stubWindow.location.pathname + stubWindow.location.search).toBe('/a?x=1');
  expect(listener).not.toHaveBeenCalled();
});

test('reports browser-originated changes with the stored id', async () => {
  const adapter = createBrowserHistoryAdapter();
  const listener = jest.fn();
  adapter.listen(listener);
  adapter.apply({ type: 'browser-history', op: 'replace', entryId: 'a', path: '/a' });
  adapter.apply({ type: 'browser-history', op: 'push', entryId: 'b', path: '/b?q=1#hash' });
  await settle();

  stubWindow.history.back();
  await settle();

  expect(listener).toHaveBeenCalledWith({ id: 'a', path: '/a' });

  stubWindow.history.forward();
  await settle();

  expect(listener).toHaveBeenLastCalledWith({ id: 'b', path: '/b?q=1#hash' });
});

test('reports a null id for an entry the browser created', async () => {
  const adapter = createBrowserHistoryAdapter();
  const listener = jest.fn();
  adapter.listen(listener);
  adapter.apply({ type: 'browser-history', op: 'replace', entryId: 'a', path: '/a' });
  await settle();

  stubWindow.history.pushState(null, '', '/a#section');
  stubWindow.history.back();
  await settle();
  stubWindow.history.forward();
  await settle();

  expect(listener).toHaveBeenLastCalledWith({ id: null, path: '/a#section' });
});

test('turns a repeated push for the current entry into a replace', async () => {
  const adapter = createBrowserHistoryAdapter();
  adapter.apply({ type: 'browser-history', op: 'replace', entryId: 'a', path: '/a' });
  adapter.apply({ type: 'browser-history', op: 'push', entryId: 'b', path: '/b' });
  adapter.apply({ type: 'browser-history', op: 'push', entryId: 'b', path: '/b?again=1' });
  await settle();

  expect(stubWindow.location.pathname + stubWindow.location.search).toBe('/b?again=1');
  stubWindow.history.back();
  await settle();
  expect(stubWindow.history.state).toEqual({ id: 'a' });
});

test('waits for a slow traversal before running the next command', async () => {
  const adapter = createBrowserHistoryAdapter();
  const listener = jest.fn();
  adapter.listen(listener);

  adapter.apply({ type: 'browser-history', op: 'replace', entryId: 'a', path: '/a' });
  adapter.apply({ type: 'browser-history', op: 'push', entryId: 'b', path: '/b' });
  await settle();

  // Firefox can take several hundred milliseconds to run a traversal when the main thread is busy.
  const traverse = stubWindow.history.go;
  jest
    .spyOn(stubWindow.history, 'go')
    .mockImplementation((n: number) => void setTimeout(() => traverse(n), 600));

  adapter.apply({ type: 'browser-history', op: 'go', delta: -1 });
  adapter.apply({ type: 'browser-history', op: 'replace', entryId: 'a', path: '/a?updated=1' });
  await new Promise((resolve) => setTimeout(resolve, 900));

  // The replace has to land on the entry the traversal selected, not on the one it left.
  expect(stubWindow.history.state).toEqual({ id: 'a' });
  expect(stubWindow.location.pathname + stubWindow.location.search).toBe('/a?updated=1');
  expect(listener).not.toHaveBeenCalled();
});
