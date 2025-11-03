import { AsyncLocalStorage } from 'node:async_hooks';

import { StatusError, environment, origin, runTask, deferTask, setResponseHeaders } from '../api';
import { createRequestScope } from '../index';

const STORE = new AsyncLocalStorage();

it('throws when API is called in uninitialized context', async () => {
  expect(() => {
    environment();
  }).toThrow(/Invalid server runtime API call/);
});

it('throws when API is not provided by scope', async () => {
  const run = createRequestScope(STORE, () => ({ environment: undefined }));
  await expect(async () => {
    await run(async () => {
      environment();
      return Response.json({ ok: true });
    });
  }).rejects.toThrow(/Unsupported server runtime API call/);
});

it('provides specified origin and environment values', async () => {
  const run = createRequestScope(STORE, () => ({
    environment: 'test',
    origin: 'https://test.local',
  }));

  const result = await run(async () => {
    expect(environment()).toBe('test');
    expect(origin()).toBe('https://test.local');
    return Response.json({ ok: true });
  });
  expect(result).toBeInstanceOf(Response);
});

it('provides specified origin as a global', async () => {
  const run = createRequestScope(STORE, () => ({
    origin: 'https://test.local',
  }));

  const result = await run(async () => {
    expect(globalThis.origin).toBe(origin());
    return Response.json({ ok: true });
  });
  expect(result).toBeInstanceOf(Response);
});

describe('runTask', () => {
  it('calls waitUntil with specified runTask invocation', async () => {
    const mockTask = jest.fn().mockResolvedValue(undefined);
    const waitUntil = jest.fn();
    const run = createRequestScope(STORE, () => ({ waitUntil }));
    const result = await run(async () => {
      runTask(mockTask);
      expect(mockTask).toHaveBeenCalled();
      expect(waitUntil).toHaveBeenCalled();
      return Response.json({ ok: true });
    });
    expect(result).toBeInstanceOf(Response);
  });

  it('provides mock waitUntil implementation if none is provided', async () => {
    const mockTask = jest.fn().mockResolvedValue(undefined);
    const run = createRequestScope(STORE, () => ({}));
    const result = await run(async () => {
      runTask(mockTask);
      expect(mockTask).toHaveBeenCalled();
      return Response.json({ ok: true });
    });
    expect(result).toBeInstanceOf(Response);
  });
});

describe('deferTask', () => {
  it('calls waitUntil with specified deferTask invocation after response resolved', async () => {
    const mockTask = jest.fn().mockResolvedValue(undefined);
    const waitUntil = jest.fn();
    const run = createRequestScope(STORE, () => ({ waitUntil }));
    const result = await run(async () => {
      deferTask(mockTask);
      expect(mockTask).not.toHaveBeenCalled();
      expect(waitUntil).not.toHaveBeenCalled();
      return Response.json({ ok: true });
    });
    expect(result).toBeInstanceOf(Response);
    expect(mockTask).toHaveBeenCalled();
    expect(waitUntil).toHaveBeenCalled();
  });

  it('ignores deferred tasks on error', async () => {
    const mockTask = jest.fn().mockResolvedValue(undefined);
    const waitUntil = jest.fn();
    const run = createRequestScope(STORE, () => ({ waitUntil }));
    const result = await run(async () => {
      deferTask(mockTask);
      throw new StatusError();
    });
    expect(result).toBeInstanceOf(Response);
    expect(mockTask).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });
});

describe('try-catch', () => {
  it('uses StatusError to construct error response if one is thrown', async () => {
    const run = createRequestScope(STORE, () => ({}));
    const result = await run(async () => {
      throw new StatusError(418, 'I might be a teapot');
    });
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(418);
    expect(await result.text()).toBe('I might be a teapot');
  });

  it('uses StatusError to construct a JSON response if one is thrown', async () => {
    const run = createRequestScope(STORE, () => ({}));
    const result = await run(async () => {
      throw new StatusError(418, { test: 'I might be a teapot' });
    });
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(418);
    expect(await result.json()).toEqual({ test: 'I might be a teapot' });
  });

  it('uses thrown Response as response if thrown', async () => {
    const run = createRequestScope(STORE, () => ({}));
    const result = await run(async () => {
      throw new Response(null, { status: 204 });
    });
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(204);
  });
});

describe('setResponseHeaders', () => {
  it('updates response headers when setResponseHeaders is called with record', async () => {
    const run = createRequestScope(STORE, () => ({}));
    const result = await run(async () => {
      setResponseHeaders({
        'X-Test': 'true',
        'X-List': ['2'],
      });
      return new Response(null, {
        status: 204,
        headers: {
          'X-List': '1',
        },
      });
    });
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(204);
    expect(result.headers.get('X-Test')).toBe('true');
    expect(result.headers.get('X-List')).toBe('1, 2');
  });

  it('updates response headers when setResponseHeaders is called with headers', async () => {
    const run = createRequestScope(STORE, () => ({}));
    const result = await run(async () => {
      setResponseHeaders(new Headers({ 'X-Test': 'true' }));
      return new Response(null, { status: 204 });
    });
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(204);
    expect(result.headers.get('X-Test')).toBe('true');
  });

  it('can mutate response headers when setResponseHeaders is called with function', async () => {
    const run = createRequestScope(STORE, () => ({}));
    const result = await run(async () => {
      setResponseHeaders((headers) => {
        headers.append('X-Test', '2');
      });
      return new Response(null, {
        status: 204,
        headers: {
          'X-Test': '1',
        },
      });
    });
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(204);
    expect(result.headers.get('X-Test')).toBe('1, 2');
  });
});
