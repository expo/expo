import { expectType, expectError } from 'tsd-lite';

import {
  useGlobalSearchParams,
  useSegments,
  useRouter,
  useSearchParams,
  useLocalSearchParams,
} from './fixtures/basic';

// eslint-disable-next-line react-hooks/rules-of-hooks
const router = useRouter();

describe('router.push()', () => {
  // router.push will return void when the type matches, otherwise it should error

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

    it.skip('works for optional CatchAll routes', () => {
      // CatchAll routes are not currently optional
      // expectType<void>(router.push('/animals/'));
    });

    it('will error when providing extra parameters', () => {
      expectError(router.push('/colors/blue/test'));
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
  expectType<Record<'color', string>>(useSearchParams<Record<'color', string>>());
  expectType<Record<'color', string> & Record<string, string | string[]>>(
    useSearchParams<'/colors/[color]'>()
  );

  expectError(useSearchParams<'/invalid'>());
  expectError(useSearchParams<Record<'custom', Function>>());
});

describe('useLocalSearchParams', () => {
  expectType<Record<'color', string>>(useLocalSearchParams<Record<'color', string>>());
  expectType<Record<'color', string> & Record<string, string | string[]>>(
    useLocalSearchParams<'/colors/[color]'>()
  );

  expectError(useSearchParams<'/invalid'>());
  expectError(useSearchParams<Record<'custom', Function>>());
});

describe('useGlobalSearchParams', () => {
  expectType<Record<'color', string>>(useGlobalSearchParams<Record<'color', string>>());
  expectType<Record<'color', string> & Record<string, string | string[]>>(
    useGlobalSearchParams<'/colors/[color]'>()
  );

  expectError(useGlobalSearchParams<'/invalid'>());
  expectError(useGlobalSearchParams<Record<'custom', Function>>());
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
