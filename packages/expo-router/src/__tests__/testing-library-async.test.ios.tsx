import { screen } from '@testing-library/react-native';

import { renderRouter, testRouter } from '../testing-library';

/*
 * Simulates `@testing-library/react-native` v14, where `render` and `act` are asynchronous
 * (https://github.com/expo/expo/issues/47444). Like v14, the mocked `render` resolves with the
 * same object it registers as `screen`.
 */
jest.mock('@testing-library/react-native', () => {
  const actual = jest.requireActual('@testing-library/react-native');
  const mocked = {
    ...actual,
    render: (...args: Parameters<typeof actual.render>) => Promise.resolve(actual.render(...args)),
    act: (callback: () => unknown) => Promise.resolve(actual.act(callback)),
  };
  Object.defineProperty(mocked, 'screen', {
    get: () => actual.screen,
  });
  return mocked;
});

describe('renderRouter with an asynchronous render', () => {
  it('returns a promise and decorates the resolved result', async () => {
    const pending = renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(typeof (pending as unknown as PromiseLike<unknown>).then).toBe('function');

    const result = await pending;
    expect(result.getPathname()).toBe('/home');
    expect(result.getSegments()).toEqual(['[slug]']);
    expect(result.getSearchParams()).toEqual({ slug: 'home', test: 'true' });
  });

  it('decorates the `screen` object so the matchers work', async () => {
    await renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(screen).toHavePathname('/home');
    expect(screen).toHavePathnameWithParams('/home?test=true');
    expect(screen).toHaveSegments(['[slug]']);
  });

  it('supports the `testRouter` helpers with an asynchronous `act`', async () => {
    await renderRouter(['[slug]'], { initialUrl: '/home' });
    await testRouter.navigate('/other');
    expect(screen).toHavePathname('/other');
    await testRouter.back('/home');
  });

  it('fails with an actionable message when the render result is not awaited', async () => {
    const pending = renderRouter(['[slug]'], { initialUrl: '/home' });
    expect(() => expect(pending).toHavePathname('/home')).toThrow(
      'await it when using @testing-library/react-native v14'
    );
    await pending;
  });
});
