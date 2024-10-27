import { expectType, expectError, expectAssignable, expectNotAssignable } from 'tsd-lite';

import { useRouter, Href, useLocalSearchParams, useSegments } from './fixtures/basic';

// eslint-disable-next-line react-hooks/rules-of-hooks
const router = useRouter();

describe('Href', () => {
  describe('Static routes', () => {
    expectAssignable<Href>('/apple');
    expectAssignable<Href>('/apple?test=1');
    expectAssignable<Href>('/banana');
    expectAssignable<Href>('/banana?test=1&another=2');

    expectAssignable<Href>({
      pathname: '/apple',
    } as const);

    expectAssignable<Href>({
      pathname: '/apple',
      params: { test: 'true' },
    } as const);

    expectNotAssignable<Href>('/invalid');
    expectNotAssignable<Href>({
      pathname: '/apple',
      params: { ONLY_STRINGS_ALLOWED: true },
    });
  });

  describe('Relative routes', () => {
    expectAssignable<Href>('./anything');
    expectAssignable<Href>('../anything?test=1&another=2');
    expectAssignable<Href>('./anything?test=1');
    expectAssignable<Href>('../anything');

    expectNotAssignable<Href>('.../invalid');
  });

  describe('Dynamic routes', () => {
    expectAssignable<Href>('/colors/blue');
    expectAssignable<Href>('/colors/blue?test=1');
    expectAssignable<Href>('/colors/blue?test=1');

    expectAssignable<Href>('/animals/cat');
    expectAssignable<Href>('/animals/cat/dog?test=1');

    expectAssignable<Href>('/(group)/(a)/folder/slug1');
    expectAssignable<Href>('/(group)/folder/slug1');
    expectAssignable<Href>('/(a)/folder/slug1');
    expectAssignable<Href>('/(group)/(b)/folder/slug1/slug2');
    expectAssignable<Href>('/(group)/(a)/folder/slug1/slug2/slug2');

    expectAssignable<Href>({
      pathname: '/(group)/(a)/folder/[slug]',
      params: {
        slug: 'slug12',
      },
    } as const);

    expectNotAssignable('/colors/blue/test');
  });

  describe('External routes', () => {
    expectAssignable<Href>('http://www.expo.dev');
    expectAssignable<Href>('http://expo.dev');
    expectAssignable<Href>('tel:012345');
    expectAssignable<Href>('mailto:email@email.com');
    expectAssignable<Href>('mailto:email@email.com');
  });

  describe('Groups', () => {
    expectAssignable<Href>('/folder');
    expectAssignable<Href>('/(group)/folder');
    expectAssignable<Href>('/(group)/(a)/folder');
    expectAssignable<Href>('/(group)/(b)/folder');
  });
});

describe('props', () => {
  // This works because its a valid route
  expectAssignable<Href>('/(c)/folder/single-part');
  // This works because without a generic TypeScript will type it as `/(c)/folder/${string}`
  expectAssignable<Href>('/(c)/folder/single-part/valid-only-on-Href-without-generic');
  // This will error because the generic is not a valid route
  expectNotAssignable<Href<'/(c)/folder/single-part/valid-only-on-Href-without-generic'>>(
    '/(c)/folder/single-part/valid-only-on-Href-without-generic'
  );
});

describe('router.push()', () => {
  //   // router.push will return void when the type matches, otherwise it should error
  describe('href', () => {
    it('will error on non-urls', () => {
      expectError(router.push('should-error'));
    });
    it('can accept an absolute url', () => {
      expectType<void>(router.push('/apple'));
      expectType<void>(router.push('/banana'));
    });
    it('can accept a ANY relative url', () => {
      // We only type-check absolute urls
      expectType<void>(router.push('./this/work/but/is/not/valid'));
    });
    it('works for dynamic urls', () => {
      expectType<void>(router.push('/colors/blue'));
    });
    it('works for CatchAll routes', () => {
      expectType<void>(router.push('/animals/bear'));
      expectType<void>(router.push('/animals/bear/cat/dog'));
      expectType<void>(router.push('/mix/apple/blue/cat/dog'));
    });
    it('works for optional CatchAll routes', () => {
      // CatchAll routes are not currently optional
      expectType<void>(router.push('/animals/'));
    });
    it('will error when providing too few parameters', () => {
      expectError(router.push('/mix/apple'));
      expectError(router.push('/mix/apple/cat'));
    });
  });

  describe('HrefObject', () => {
    it('will error on non-urls', () => {
      expectError(router.push({ pathname: 'should-error' }));
    });
    it('can accept an absolute url', () => {
      expectType<void>(router.push({ pathname: '/apple' }));
      expectType<void>(router.push({ pathname: '/banana' }));
    });
    it('can accept a ANY relative url', () => {
      // We only type-check absolute urls
      expectType<void>(router.push({ pathname: './this/work/but/is/not/valid' }));
    });
    it('works for dynamic urls', () => {
      expectType<void>(
        router.push({
          pathname: '/colors/[color]',
          params: { color: 'blue' },
        })
      );
    });
    it('requires a valid pathname', () => {
      expectError(
        router.push({
          pathname: '/colors/[invalid]',
          params: { color: 'blue' },
        })
      );
    });
    it('requires a valid param', () => {
      expectError(
        router.push({
          pathname: '/colors/[color]',
          params: { invalid: 'blue' },
        })
      );
    });
    it('works for catch all routes', () => {
      expectType<void>(
        router.push({
          pathname: '/animals/[...animal]',
          params: { animal: ['cat', 'dog'] },
        })
      );
    });
    it('allows numeric inputs', () => {
      expectType<void>(
        router.push({
          pathname: '/mix/[fruit]/[color]/[...animals]',
          params: { color: 1, fruit: 'apple', animals: [2, 'cat'] },
        })
      );
    });
    it('requires an array for catch all routes', () => {
      expectError(
        router.push({
          pathname: '/animals/[...animal]',
          params: { animal: 'cat' },
        })
      );
    });
    it('works for mixed routes', () => {
      expectType<void>(
        router.push({
          pathname: '/mix/[fruit]/[color]/[...animals]',
          params: { color: 'red', fruit: 'apple', animals: [] },
        })
      );
    });
    it('requires all params in mixed routes', () => {
      expectError(
        router.push({
          pathname: '/mix/[fruit]/[color]/[...animals]',
          params: { color: 'red', animals: ['cat', 'dog'] },
        })
      );
    });
  });
});
describe('useSearchParams', () => {
  expectType<Record<'color', string>>(useLocalSearchParams<Record<'color', string>>());
  expectType<Record<'color', string> & Record<string, string | string[]>>(
    useLocalSearchParams<'/colors/[color]'>()
  );
  expectError(useLocalSearchParams<'/invalid'>());
  expectError(useLocalSearchParams<Record<'custom', Function>>());
});
describe('useLocalSearchParams', () => {
  expectType<Record<'color', string>>(useLocalSearchParams<Record<'color', string>>());
  expectType<Record<'color', string> & Record<string, string | string[]>>(
    useLocalSearchParams<'/colors/[color]'>()
  );
  expectError(useLocalSearchParams<'/invalid'>());
  expectError(useLocalSearchParams<Record<'custom', Function>>());
});
describe('useGlobalSearchParams', () => {
  expectType<Record<'color', string>>(useLocalSearchParams<Record<'color', string>>());
  expectType<Record<'color', string> & Record<string, string | string[]>>(
    useLocalSearchParams<'/colors/[color]'>()
  );
  expectError(useLocalSearchParams<'/invalid'>());
  expectError(useLocalSearchParams<Record<'custom', Function>>());
});
describe('useSegments', () => {
  it('can accept an absolute url', () => {
    expectType<['apple']>(useSegments<'/apple'>());
  });
  it('only accepts valid possible urls', () => {
    expectError(useSegments<'/invalid'>());
  });
  it('can accept an array of segments', () => {
    expectType<['apple']>(useSegments<['apple']>());
  });
  it('only accepts valid possible segments', () => {
    expectError(useSegments<['invalid segment']>());
  });
});
describe('external routes', () => {
  it('can accept any external url', () => {
    expectType<void>(router.push('http://expo.dev'));
  });
  it('can accept any schema url', () => {
    expectType<void>(router.push('custom-schema://expo.dev'));
  });
  it('can accept mailto url', () => {
    expectType<void>(router.push('mailto:test@test.com'));
  });
});

describe('set params', () => {
  it('is strongly typed', () => {
    expectType<void>(router.setParams<'/folder/[slug]'>({ slug: 'test' }));
  });
  it('allows additional values', () => {
    expectType<void>(router.setParams<'/folder/[slug]'>({ hello: 'world' }));
  });
  it('works without a generic', () => {
    expectType<void>(router.setParams({ hello: 'world' }));
  });
});
