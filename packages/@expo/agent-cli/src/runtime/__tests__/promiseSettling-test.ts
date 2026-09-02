import {
  buildPromisePollExpression,
  buildPromiseReleaseExpression,
  createPromiseNonce,
  isPendingPromiseMarker,
  looksLikeWrapperSyntaxError,
  parseSettledPromiseSlot,
  pendingMarkerKey,
  wrapExpressionForPromises,
} from '../promiseSettling';

const NONCE = 'abc123';

/**
 * Run generated source the way the app would, and hand back what it returned.
 *
 * The wrapper is a string of JavaScript, so the only honest test of it is to run it: a review of
 * the template cannot show that `Promise.resolve(42)` ends up as `42` on the other side.
 */
function runInFakeApp(source: string, scope: Record<string, unknown> = {}): unknown {
  const globalObject: Record<string, unknown> = {};
  const names = ['globalThis', ...Object.keys(scope)];
  const values = [globalObject, ...Object.values(scope)];
  // eslint-disable-next-line no-new-func
  return new Function(...names, `return (${source});`)(...values);
}

/** Run the wrapper and then poll, letting the microtask queue drain in between. */
async function settleAsync(
  expression: string,
  scope: Record<string, unknown> = {}
): Promise<unknown> {
  const globalObject: Record<string, unknown> = {};
  const run = (source: string) => {
    const names = ['globalThis', ...Object.keys(scope)];
    const values = [globalObject, ...Object.values(scope)];
    // eslint-disable-next-line no-new-func
    return new Function(...names, `return (${source});`)(...values);
  };

  const first = run(wrapExpressionForPromises(expression, NONCE));
  if (!isPendingPromiseMarker(first, NONCE)) {
    return first;
  }
  // Two turns: one for the subscription's `then`, one for anything it chained.
  await Promise.resolve();
  await Promise.resolve();
  return run(buildPromisePollExpression(NONCE));
}

describe(wrapExpressionForPromises, () => {
  it(`should hand back a value that is not a thenable, untouched`, () => {
    expect(runInFakeApp(wrapExpressionForPromises('1 + 41', NONCE))).toBe(42);
    expect(runInFakeApp(wrapExpressionForPromises('({ user: { id: 7 } })', NONCE))).toEqual({
      user: { id: 7 },
    });
    expect(runInFakeApp(wrapExpressionForPromises('null', NONCE))).toBeNull();
    expect(runInFakeApp(wrapExpressionForPromises('undefined', NONCE))).toBeUndefined();
    expect(runInFakeApp(wrapExpressionForPromises('"a string"', NONCE))).toBe('a string');
  });

  // The one shape that used to be reported as `{_A,_x,_y,_z}`.
  it(`should report a thenable as this run's marker`, () => {
    const marked = runInFakeApp(wrapExpressionForPromises('Promise.resolve(42)', NONCE), {
      Promise,
    });

    expect(isPendingPromiseMarker(marked, NONCE)).toBe(true);
    expect(marked).toEqual({ [pendingMarkerKey(NONCE)]: NONCE });
  });

  it(`should not treat an object that only looks like a promise as one`, () => {
    expect(runInFakeApp(wrapExpressionForPromises('({ then: 3 })', NONCE))).toEqual({ then: 3 });
  });

  it(`should park nothing in the app when it was told not to subscribe`, () => {
    const globalObject: Record<string, unknown> = {};
    // eslint-disable-next-line no-new-func
    const marked = new Function(
      'globalThis',
      'Promise',
      `return (${wrapExpressionForPromises('Promise.resolve(1)', NONCE, { subscribe: false })});`
    )(globalObject, Promise);

    expect(isPendingPromiseMarker(marked, NONCE)).toBe(true);
    expect(globalObject).toEqual({});
  });
});

describe('settling a promise in the app', () => {
  it(`should report the resolved value with the type the app read off it`, async () => {
    await expect(settleAsync('Promise.resolve(42)', { Promise })).resolves.toEqual({
      state: 'fulfilled',
      type: 'number',
      value: 42,
    });
    await expect(settleAsync('Promise.resolve({ status: 200 })', { Promise })).resolves.toEqual({
      state: 'fulfilled',
      type: 'object',
      value: { status: 200 },
    });
    await expect(settleAsync('Promise.resolve("ok")', { Promise })).resolves.toEqual({
      state: 'fulfilled',
      type: 'string',
      value: 'ok',
    });
  });

  it(`should describe a settled value the runtime cannot serialize`, async () => {
    await expect(settleAsync('Promise.resolve(function named() {})', { Promise })).resolves.toEqual(
      {
        state: 'fulfilled',
        type: 'function',
        description: expect.stringContaining('named'),
      }
    );
  });

  it(`should report a rejection with the reason and its stack`, async () => {
    const slot: any = await settleAsync('Promise.reject(new Error("BOOM"))', { Promise });

    expect(slot.state).toBe('rejected');
    expect(slot.reason.text).toBe('Error: BOOM');
    expect(slot.reason.stack).toContain('BOOM');
  });

  it(`should describe a rejection reason that is not an Error`, async () => {
    await expect(settleAsync('Promise.reject("nope")', { Promise })).resolves.toMatchObject({
      state: 'rejected',
      reason: { text: 'nope', stack: null },
    });
    await expect(settleAsync('Promise.reject({ code: 7 })', { Promise })).resolves.toMatchObject({
      state: 'rejected',
      reason: { text: '{"code":7}' },
    });
  });

  it(`should report a promise that has not settled as pending`, () => {
    const globalObject: Record<string, unknown> = {};
    const run = (source: string) =>
      // eslint-disable-next-line no-new-func
      new Function('globalThis', 'Promise', `return (${source});`)(globalObject, Promise);

    run(wrapExpressionForPromises('new Promise(function () {})', NONCE));

    expect(run(buildPromisePollExpression(NONCE))).toEqual({ state: 'pending' });
  });

  // The app reloading clears the globals, which loses the outcome rather than delaying it.
  it(`should report a slot that is gone as missing`, () => {
    expect(runInFakeApp(buildPromisePollExpression(NONCE))).toEqual({ state: 'missing' });
  });

  it(`should take the outcome out of the app once it has been read`, async () => {
    const globalObject: Record<string, unknown> = {};
    const run = (source: string) =>
      // eslint-disable-next-line no-new-func
      new Function('globalThis', 'Promise', `return (${source});`)(globalObject, Promise);

    run(wrapExpressionForPromises('Promise.resolve(1)', NONCE));
    await Promise.resolve();
    await Promise.resolve();

    expect(run(buildPromisePollExpression(NONCE))).toMatchObject({ state: 'fulfilled' });
    expect(run(buildPromisePollExpression(NONCE))).toEqual({ state: 'missing' });
  });

  it(`should let a timed-out wait release what the app is holding`, async () => {
    const globalObject: Record<string, unknown> = {};
    const run = (source: string) =>
      // eslint-disable-next-line no-new-func
      new Function('globalThis', 'Promise', `return (${source});`)(globalObject, Promise);

    run(wrapExpressionForPromises('new Promise(function () {})', NONCE));
    run(buildPromiseReleaseExpression(NONCE));

    expect(run(buildPromisePollExpression(NONCE))).toEqual({ state: 'missing' });
  });
});

describe(isPendingPromiseMarker, () => {
  it(`should not read another run's marker as this run's`, () => {
    const other = { [pendingMarkerKey('other')]: 'other' };

    expect(isPendingPromiseMarker(other, NONCE)).toBe(false);
  });

  // The nonce is in the value as well as the key, so a value copied out of an earlier report and
  // handed back is still a value.
  it(`should require the nonce in the value too`, () => {
    expect(isPendingPromiseMarker({ [pendingMarkerKey(NONCE)]: true }, NONCE)).toBe(false);
    expect(isPendingPromiseMarker({ [pendingMarkerKey(NONCE)]: NONCE }, NONCE)).toBe(true);
  });

  it(`should treat everything that is not an object as a value`, () => {
    for (const value of [null, undefined, 42, 'text', true]) {
      expect(isPendingPromiseMarker(value, NONCE)).toBe(false);
    }
  });
});

describe(createPromiseNonce, () => {
  it(`should not repeat itself`, () => {
    expect(createPromiseNonce()).not.toBe(createPromiseNonce());
  });
});

describe(parseSettledPromiseSlot, () => {
  it(`should read each outcome the app can park`, () => {
    expect(parseSettledPromiseSlot({ state: 'pending' })).toEqual({ state: 'pending' });
    expect(parseSettledPromiseSlot({ state: 'missing' })).toEqual({ state: 'missing' });
    expect(parseSettledPromiseSlot({ state: 'fulfilled', type: 'number', value: 1 })).toEqual({
      state: 'fulfilled',
      type: 'number',
      value: 1,
    });
  });

  // `value: undefined` and no `value` are different answers: one promise resolved with undefined.
  it(`should keep a value of undefined apart from an absent one`, () => {
    expect(
      parseSettledPromiseSlot({ state: 'fulfilled', type: 'undefined', value: undefined })
    ).toEqual({ state: 'fulfilled', type: 'undefined', value: undefined });
    expect(parseSettledPromiseSlot({ state: 'fulfilled', type: 'function' })).toEqual({
      state: 'fulfilled',
      type: 'function',
    });
  });

  it(`should fill in a rejection the app described incompletely`, () => {
    expect(parseSettledPromiseSlot({ state: 'rejected' })).toEqual({
      state: 'rejected',
      reason: { text: 'The app reported no reason.', stack: null },
    });
  });

  it(`should return null for an answer that is not one of ours`, () => {
    expect(parseSettledPromiseSlot({ _A: null, _x: 0, _y: 1, _z: 42 })).toBeNull();
    expect(parseSettledPromiseSlot(42)).toBeNull();
    expect(parseSettledPromiseSlot(null)).toBeNull();
  });
});

describe(looksLikeWrapperSyntaxError, () => {
  it(`should recognise the answer a statement produces`, () => {
    expect(looksLikeWrapperSyntaxError("SyntaxError: 'var' is not allowed here")).toBe(true);
  });

  // Hermes does not throw a SyntaxError; this is its answer to `var x = 1` inside the wrapper
  // [observed — Expo Go on iOS, SDK 57, 2026-08-23]. Matching only `SyntaxError` left the fallback
  // unreachable on the one runtime this command talks to.
  it(`should recognise the words Hermes uses for a compile failure`, () => {
    expect(
      looksLikeWrapperSyntaxError('Compiling JS failed: 2:25:invalid expression, sourceURL: ')
    ).toBe(true);
  });

  it(`should leave every other exception to the caller`, () => {
    expect(looksLikeWrapperSyntaxError('TypeError: x is not a function')).toBe(false);
    expect(looksLikeWrapperSyntaxError(undefined)).toBe(false);
    expect(looksLikeWrapperSyntaxError('Error: SyntaxError was mentioned')).toBe(false);
  });
});
