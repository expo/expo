import type { RouteNode } from '../../Route';
import type { ScreenProps } from '../../useScreens';
import * as sitemap from '../../views/useSitemap';
import { attachPreloadHrefs } from '../preloadHref';

function makeNode(): RouteNode {
  const childA = { route: 'a', children: [] } as unknown as RouteNode;
  const childB = { route: 'b', children: [] } as unknown as RouteNode;
  const node = { route: '', children: [childA, childB] } as unknown as RouteNode;
  return node;
}

test('attaches the compiled href to object-options screens', () => {
  const node = makeNode();
  const hrefMap = new Map<RouteNode, string>([
    [node.children[0]!, '/a'],
    [node.children[1]!, '/b'],
  ]);
  jest.spyOn(sitemap, 'getRouteNodeHrefMap').mockReturnValue(hrefMap);

  const screens: ScreenProps[] = [{ name: 'a', options: { title: 'A' } }];
  const [result] = attachPreloadHrefs(screens, node);

  expect(result!.options).toEqual({ title: 'A', unstable_preloadHref: '/a' });
});

test('attaches the compiled href to function-options screens by wrapping them', () => {
  const node = makeNode();
  const hrefMap = new Map<RouteNode, string>([
    [node.children[0]!, '/a'],
    [node.children[1]!, '/b'],
  ]);
  jest.spyOn(sitemap, 'getRouteNodeHrefMap').mockReturnValue(hrefMap);

  const screens: ScreenProps[] = [{ name: 'b', options: () => ({ title: 'B' }) }];
  const [result] = attachPreloadHrefs(screens, node);

  expect(typeof result!.options).toBe('function');
  expect((result!.options as (args: any) => object)({})).toEqual({
    title: 'B',
    unstable_preloadHref: '/b',
  });
});

test('leaves a screen untouched when its href does not resolve', () => {
  const node = makeNode();
  jest.spyOn(sitemap, 'getRouteNodeHrefMap').mockReturnValue(new Map());

  const optionsFn = () => ({ title: 'X' });
  const screens: ScreenProps[] = [{ name: 'x', options: optionsFn }];
  const [result] = attachPreloadHrefs(screens, node);

  expect(result!.options).toBe(optionsFn);
});

test('is a no-op without a route node', () => {
  const screens: ScreenProps[] = [{ name: 'a', options: { title: 'A' } }];
  expect(attachPreloadHrefs(screens, null)).toBe(screens);
});
