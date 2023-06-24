import { expectType, expectError } from 'tsd-lite';

import { useGlobalSearchParams, useSegments, useRouter, useSearchParams } from './fixtures/basic';

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
      expectError(router.push('/colors/blue/test'));

      expectType<void>(router.push('/animals/bear'));
      expectType<void>(router.push('/animals/bear/cat/dog'));

      // This will fail because it is missing params
      expectError(router.push('/mix/apple'));
      expectError(router.push('/mix/apple/cat'));
      expectType<void>(router.push('/mix/apple/blue/cat/dog'));
    });

    it('can accept any external url', () => {
      expectType<void>(router.push('http://expo.dev'));
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
          params: { color: 'red', fruit: 'apple', animals: ['cat', 'dog'] },
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
  expectType<Record<'color', string>>(useSearchParams<'/colors/[color]'>());
  expectType<Record<'color', string>>(useSearchParams<Record<'color', string>>());
  expectError(useSearchParams<'/invalid'>());
  expectError(useSearchParams<Record<'custom', string>>());
});

describe('useGlobalSearchParams', () => {
  expectType<Record<'color', string>>(useGlobalSearchParams<'/colors/[color]'>());
  expectType<Record<'color', string>>(useGlobalSearchParams<Record<'color', string>>());
  expectError(useGlobalSearchParams<'/invalid'>());
  expectError(useGlobalSearchParams<Record<'custom', string>>());
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
