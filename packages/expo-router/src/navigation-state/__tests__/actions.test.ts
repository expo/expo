import { resolveNavigate } from '../actions';
import { hydrate } from '../hydration';
import { reduce } from '../reducer';
import { ROOT_NAME } from '../tree';
import type { BehaviorLookup } from '../types';

// Phase 3a — forward navigation resolution (RFC scenario 3/4: navigate).
//
// `resolveNavigate` diffs a hydrated target against current state along the target's focused path
// and emits ops via the resolution seam. Tested by hydrating both ends (an independent oracle) and
// reducing the ops, so a wrong diff produces a wrong tree.

const options = {
  screens: {
    home: {
      path: 'home',
      initialRouteName: 'index',
      screens: { index: '', details: 'details', other: 'other' },
    },
    search: {
      path: 'search',
      initialRouteName: 'index',
      screens: { index: '', results: 'results' },
    },
    post: { path: 'post/:id' },
  },
} as const;

const lookup: BehaviorLookup = { [ROOT_NAME]: 'tabs', home: 'stack', search: 'stack' };

const nav = (from: string, to: string) => {
  const current = hydrate(from, options)!;
  const ops = resolveNavigate(current, hydrate(to, options)!, lookup);
  return reduce(current, { ops, source: 'js' });
};

it('pushes into the focused stack, leaving other tabs unpromoted (scenario 3)', () => {
  const after = nav('/home', '/home/details');
  expect(after.root.routes.map((r) => r.name)).toEqual(['home']); // search still not promoted
  const stack = after.root.routes[0].child!;
  expect(stack.routes.map((r) => r.name)).toEqual(['index', 'details']);
  expect(stack.index).toBe(1);
});

it('promotes and focuses another tab on a plain switch (scenario 4)', () => {
  const after = nav('/home', '/search');
  expect(after.root.routes.map((r) => r.name)).toEqual(['home', 'search']);
  expect(after.root.index).toBe(1); // search focused
  expect(after.root.routes[1].child!.routes.map((r) => r.name)).toEqual(['index']);
  // home branch retained, untouched
  expect(after.root.routes[0].child!.routes.map((r) => r.name)).toEqual(['index']);
});

it('promotes another tab AND applies the deep in-tab path in one batch (scenario 4 deep)', () => {
  const after = nav('/home', '/search/results');
  expect(after.root.routes.map((r) => r.name)).toEqual(['home', 'search']);
  expect(after.root.index).toBe(1);
  const searchStack = after.root.routes[1].child!;
  expect(searchStack.routes.map((r) => r.name)).toEqual(['index', 'results']);
  expect(searchStack.index).toBe(1);
});

it('navigating to a sibling in the focused stack pushes it, preserving history', () => {
  // navigate semantics: a route absent from the stack is pushed (not a replace — that is `replace`).
  const after = nav('/home/details', '/home/other');
  const stack = after.root.routes[0].child!;
  expect(stack.routes.map((r) => r.name)).toEqual(['index', 'details', 'other']);
  expect(stack.index).toBe(2);
});

it('refocuses an already-promoted tab without adding a route or touching its stack', () => {
  // Start with both tabs promoted, focused on search.
  const current = hydrate('/home', options)!;
  const promoted = reduce(current, {
    ops: resolveNavigate(current, hydrate('/search', options)!, lookup),
    source: 'js',
  });
  expect(promoted.root.index).toBe(1);

  const back = reduce(promoted, {
    ops: resolveNavigate(promoted, hydrate('/home', options)!, lookup),
    source: 'js',
  });
  expect(back.root.routes.map((r) => r.name)).toEqual(['home', 'search']); // no new route
  expect(back.root.index).toBe(0); // home refocused
  expect(back.root.routes[0].child!.routes.map((r) => r.name)).toEqual(['index']); // home stack untouched
});

it('navigating to the current location nets no change (redundant ops absorbed by the reducer)', () => {
  const current = hydrate('/home', options)!;
  const ops = resolveNavigate(current, hydrate('/home', options)!, lookup);
  // The ops are not necessarily empty (a redundant setIndex is emitted); the reducer collapses them.
  expect(reduce(current, { ops, source: 'js' })).toBe(current); // referential bail-out
});

it('KNOWN LIMIT: re-navigating to a same-named route focuses it WITHOUT updating params (needs `replace`)', () => {
  const current = hydrate('/post/1', options)!;
  expect((current.root.routes[0].params as { id: string }).id).toBe('1');
  const after = reduce(current, {
    ops: resolveNavigate(current, hydrate('/post/2', options)!, lookup),
    source: 'js',
  });
  // Matched by name → focused; params stay stale until the deferred `replace` primitive lands.
  expect((after.root.routes[0].params as { id: string }).id).toBe('1');
});
