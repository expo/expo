import type { RouteNode } from '../Route';
import { getLayoutAnchor, loadLayouts } from '../layoutAnchor';

// Like async routes on native, `loadRoute` returns a new promise on every call.
function asyncLayoutNode() {
  const loadRoute = jest.fn(() => Promise.resolve({ unstable_settings: { anchor: 'b' } }));
  // The nodes only have the fields that anchor reads use.
  const child = (route: string) => ({ route, children: [] }) as unknown as RouteNode;
  const node = {
    type: 'layout',
    children: [child('a'), child('b')],
    loadRoute,
  } as unknown as RouteNode;
  return { node, loadRoute };
}

it('calls `loadRoute` once for all reads made while the layout loads', async () => {
  const { node, loadRoute } = asyncLayoutNode();

  expect(getLayoutAnchor(node)).toBeUndefined();
  expect(getLayoutAnchor(node)).toBeUndefined();
  await loadLayouts([node]);

  expect(loadRoute).toHaveBeenCalledTimes(1);
  expect(getLayoutAnchor(node)).toBe('b');
});

it('does not call `loadRoute` again for a layout that is already loaded', async () => {
  const { node, loadRoute } = asyncLayoutNode();

  await loadLayouts([node]);
  await loadLayouts([node]);

  expect(loadRoute).toHaveBeenCalledTimes(1);
});
