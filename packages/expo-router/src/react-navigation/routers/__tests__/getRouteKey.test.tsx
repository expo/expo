import { expect, test } from '@jest/globals';

import { getNextRouteKeyFromState, getRouteKey, getStateKey } from '../getRouteKey';

test('derives a route key from state key, name, and index (index always emitted)', () => {
  expect(getRouteKey({ stateKey: '@', name: 'home', index: 0 })).toBe('@:home:0');
  expect(getRouteKey({ stateKey: '@', name: 'details', index: 1 })).toBe('@:details:1');
  expect(getRouteKey({ stateKey: '@', name: 'details', index: 2 })).toBe('@:details:2');
});

test('defaults the index to 0 (still emitted)', () => {
  expect(getRouteKey({ stateKey: '@', name: 'home' })).toBe('@:home:0');
});

test('getStateKey seeds the root with @ and is otherwise the parent route key verbatim', () => {
  expect(getStateKey(undefined)).toBe('@');
  expect(getStateKey('@:home:0')).toBe('@:home:0');
});

test('escapes the separator and escape char in route names (escape char first)', () => {
  // `:` in a name must not read as a structural separator.
  expect(getRouteKey({ stateKey: '@', name: 'a:b', index: 0 })).toBe('@:a%:b:0');
  // `%` escapes to `%%`.
  expect(getRouteKey({ stateKey: '@', name: 'a%b', index: 0 })).toBe('@:a%%b:0');
  // Escape char comes first, so `%:` becomes `%%%:`, never `%%:` (which would decode ambiguously).
  expect(getRouteKey({ stateKey: '@', name: '%:', index: 0 })).toBe('@:%%%::0');
});

test('escaping is injective across adversarial names (guards the escape-char-first order)', () => {
  // Names picked to collide under the wrong (separator-first) escape order. All must stay distinct.
  const names = ['%', ':', '%:', ':%', '%%', '%%:', 'a:b', 'a%b', 'a', 'a:0', 'a%:b'];
  const keys = names.map((n) => getRouteKey({ stateKey: '@', name: n, index: 0 }));
  expect(new Set(keys).size).toBe(keys.length);
});

test('escaping keeps the encoding injective — a `a:b` route never collides with a nested `a`->`b`', () => {
  const shallow = getRouteKey({ stateKey: '@', name: 'a:b', index: 0 }); // @:a%:b:0
  const nested = getRouteKey({
    stateKey: getStateKey(getRouteKey({ stateKey: '@', name: 'a', index: 0 })),
    name: 'b',
    index: 0,
  }); // @:a:0:b:0
  expect(shallow).not.toBe(nested);
  expect(shallow).toBe('@:a%:b:0');
  expect(nested).toBe('@:a:0:b:0');
});

test('does not re-escape the parent state key (only the new name is escaped)', () => {
  const parentRouteKey = getRouteKey({ stateKey: '@', name: 'a:b', index: 0 }); // @:a%:b:0
  const stateKey = getStateKey(parentRouteKey); // @:a%:b:0 (verbatim)
  // The already-escaped `a%:b` segment is preserved; only `c` is escaped this round.
  expect(getRouteKey({ stateKey, name: 'c', index: 0 })).toBe('@:a%:b:0:c:0');
});

test('getNextRouteKeyFromState returns index 0 when no route uses the name', () => {
  expect(
    getNextRouteKeyFromState({
      stateKey: '@',
      name: 'details',
      state: { routes: [{ key: '@:home:0', name: 'home' }] },
    })
  ).toBe('@:details:0');
});

test('getNextRouteKeyFromState uses the same-name count as the next index', () => {
  const state = {
    routes: [
      { key: '@:details:0', name: 'details' },
      { key: '@:details:1', name: 'details' },
    ],
  };
  expect(getNextRouteKeyFromState({ stateKey: '@', name: 'details', state })).toBe('@:details:2');
});

test('getNextRouteKeyFromState bumps past a collision at the count-based index', () => {
  // One `details` route, so the base index is 1 — but `:1` is already taken, so it bumps to `:2`.
  const state = { routes: [{ key: '@:details:1', name: 'details' }] };
  expect(getNextRouteKeyFromState({ stateKey: '@', name: 'details', state })).toBe('@:details:2');
});
