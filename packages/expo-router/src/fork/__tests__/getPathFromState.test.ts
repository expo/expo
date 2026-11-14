import { getPathFromState } from '../getPathFromState';
import { getStateFromPath } from '../getStateFromPath';

it.each([['a?b c', '50%', 'd#e'], 'a?b c/50%/d#e'])(
  'encodes each catch-all segment (%j)',
  (slug) => {
    const config = { screens: { '[...slug]': '*slug' } };
    const path = getPathFromState({ routes: [{ name: '[...slug]', params: { slug } }] }, config);

    expect(path).toBe('/a%3Fb%20c/50%25/d%23e');
    expect(getStateFromPath(path, config)?.routes[0]!.params).toEqual({
      slug: ['a?b c', '50%', 'd#e'],
    });
  }
);

it.each([['hello', 'world'], 'hello/world'])('keeps plain catch-all segments (%j)', (slug) => {
  const config = { screens: { '[...slug]': '*slug' } };
  const path = getPathFromState({ routes: [{ name: '[...slug]', params: { slug } }] }, config);

  expect(path).toBe('/hello/world');
  expect(getStateFromPath(path, config)?.routes[0]!.params).toEqual({
    slug: ['hello', 'world'],
  });
});

it.each([['😀'], '😀'])('encodes an emoji catch-all segment (%j)', (slug) => {
  const config = { screens: { '[...slug]': '*slug' } };
  const path = getPathFromState({ routes: [{ name: '[...slug]', params: { slug } }] }, config);

  expect(path).toBe('/%F0%9F%98%80');
  expect(getStateFromPath(path, config)?.routes[0]!.params).toEqual({
    slug: ['😀'],
  });
});

it.each([['zażółć', 'ąęć', 'straße'], 'zażółć/ąęć/straße'])(
  'encodes catch-all segments with national characters (%j)',
  (slug) => {
    const config = { screens: { '[...slug]': '*slug' } };
    const path = getPathFromState({ routes: [{ name: '[...slug]', params: { slug } }] }, config);

    expect(path).toBe('/za%C5%BC%C3%B3%C5%82%C4%87/%C4%85%C4%99%C4%87/stra%C3%9Fe');
    expect(getStateFromPath(path, config)?.routes[0]!.params).toEqual({
      slug: ['zażółć', 'ąęć', 'straße'],
    });
  }
);

it.each([['日本語', 'привет', 'مرحبا'], '日本語/привет/مرحبا'])(
  'encodes catch-all segments in non-Latin scripts (%j)',
  (slug) => {
    const config = { screens: { '[...slug]': '*slug' } };
    const path = getPathFromState({ routes: [{ name: '[...slug]', params: { slug } }] }, config);

    expect(path).toBe(
      '/%E6%97%A5%E6%9C%AC%E8%AA%9E/%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7'
    );
    expect(getStateFromPath(path, config)?.routes[0]!.params).toEqual({
      slug: ['日本語', 'привет', 'مرحبا'],
    });
  }
);
