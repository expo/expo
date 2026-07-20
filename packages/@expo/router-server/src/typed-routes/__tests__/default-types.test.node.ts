import { inMemoryContext } from 'expo-router/internal/testing';

import { getTypedRoutesDeclarationFile } from '../generate';
import { formatDiagnostics, getTypeErrors, ts } from './tsHarness';

const routes = getTypedRoutesDeclarationFile(
  inMemoryContext({
    '/apple': () => null,
    '/banana': () => null,
    '/colors/[color]': () => null,
    '/animals/[...animal]': () => null,
    '/mix/[fruit]/[color]/[...animals]': () => null,
    '/(group)/static': () => null,
    '/(group)/(a,b)/folder/index': () => null,
    '/(group)/(a,b)/folder/[slug]': () => null,
    '/(group)/(a,b)/folder/[...slug]': () => null,
    '/(c)/folder/[slug]': () => null,
    '/(group)/index': () => null,
  }),
  { testIgnoreComments: true }
);

const assertions = ts`
  import { expectTypeOf } from 'expect-type';
  import type { Href, UnknownOutputParams } from './routes';
  import { useRouter, useLocalSearchParams, useSegments } from './routes';

  const router = useRouter();

  // Href — static routes
  expectTypeOf('/apple' as const).toExtend<Href>();
  expectTypeOf('/apple?test=1' as const).toExtend<Href>();
  expectTypeOf('/banana' as const).toExtend<Href>();
  expectTypeOf('/banana?test=1&another=2' as const).toExtend<Href>();
  expectTypeOf('/' as const).toExtend<Href>();
  expectTypeOf('/(group)' as const).toExtend<Href>();
  expectTypeOf({ pathname: '/apple' } as const).toExtend<Href>();
  expectTypeOf({ pathname: '/apple', params: { test: 'true' } } as const).toExtend<Href>();
  expectTypeOf('/invalid' as const).not.toExtend<Href>();
  expectTypeOf({ pathname: '/apple', params: { ONLY_STRINGS_ALLOWED: true } }).not.toExtend<Href>();

  // Href — relative routes
  expectTypeOf('./anything' as const).toExtend<Href>();
  expectTypeOf('../anything?test=1&another=2' as const).toExtend<Href>();
  expectTypeOf('./anything?test=1' as const).toExtend<Href>();
  expectTypeOf('../anything' as const).toExtend<Href>();
  expectTypeOf('.../invalid' as const).not.toExtend<Href>();

  // Href — dynamic routes
  expectTypeOf('/colors/blue' as const).toExtend<Href>();
  expectTypeOf('/colors/blue?test=1' as const).toExtend<Href>();
  expectTypeOf('/animals/cat' as const).toExtend<Href>();
  expectTypeOf('/animals/cat/dog?test=1' as const).toExtend<Href>();
  expectTypeOf('/(group)/(a)/folder/slug1' as const).toExtend<Href>();
  expectTypeOf('/(group)/(b)/folder/slug1/slug2' as const).toExtend<Href>();
  expectTypeOf('/(group)/(a)/folder/slug1/slug2/slug2' as const).toExtend<Href>();
  // Partial groups are not allowed by default
  expectTypeOf('/(a)/folder/slug1' as const).not.toExtend<Href>();
  expectTypeOf('/(group)/folder/slug1' as const).not.toExtend<Href>();
  expectTypeOf({
    pathname: '/(group)/(a)/folder/[slug]',
    params: { slug: 'slug12' },
  } as const).toExtend<Href>();

  // Href — external routes
  expectTypeOf('http://www.expo.dev' as const).toExtend<Href>();
  expectTypeOf('http://expo.dev' as const).toExtend<Href>();
  expectTypeOf('tel:012345' as const).toExtend<Href>();
  expectTypeOf('mailto:email@email.com' as const).toExtend<Href>();

  // Href — groups
  expectTypeOf('/folder' as const).toExtend<Href>();
  expectTypeOf('/(group)/(a)/folder' as const).toExtend<Href>();
  expectTypeOf('/(group)/(b)/folder' as const).toExtend<Href>();
  // Partial groups are not allowed by default
  expectTypeOf('/(group)/folder' as const).not.toExtend<Href>();

  // Without a generic, TypeScript widens the dynamic segment to allow extra parts
  expectTypeOf('/(c)/folder/single-part' as const).toExtend<Href>();
  expectTypeOf('/(c)/folder/single-part/valid-only-on-Href-without-generic' as const).toExtend<Href>();

  // router.push() — href string. Returns void when valid, otherwise errors.
  expectTypeOf(router.push('/apple')).toEqualTypeOf<void>();
  expectTypeOf(router.push('/banana')).toEqualTypeOf<void>();
  // Relative urls are not type-checked
  expectTypeOf(router.push('./this/work/but/is/not/valid')).toEqualTypeOf<void>();
  expectTypeOf(router.push('/colors/blue')).toEqualTypeOf<void>();
  expectTypeOf(router.push('/animals/bear')).toEqualTypeOf<void>();
  expectTypeOf(router.push('/animals/bear/cat/dog')).toEqualTypeOf<void>();
  expectTypeOf(router.push('/mix/apple/blue/cat/dog')).toEqualTypeOf<void>();
  // Catch-all routes are not currently optional
  expectTypeOf(router.push('/animals/')).toEqualTypeOf<void>();
  // @ts-expect-error not a known route
  router.push('should-error');
  // @ts-expect-error missing the [color] and [...animals] segments
  router.push('/mix/apple');
  // @ts-expect-error missing the [...animals] segment
  router.push('/mix/apple/cat');

  // router.push() — href object
  expectTypeOf(router.push({ pathname: '/apple' })).toEqualTypeOf<void>();
  expectTypeOf(router.push({ pathname: '/banana' })).toEqualTypeOf<void>();
  expectTypeOf(router.push({ pathname: './this/work/but/is/not/valid' })).toEqualTypeOf<void>();
  expectTypeOf(
    router.push({ pathname: '/colors/[color]', params: { color: 'blue' } })
  ).toEqualTypeOf<void>();
  expectTypeOf(
    router.push({ pathname: '/animals/[...animal]', params: { animal: ['cat', 'dog'] } })
  ).toEqualTypeOf<void>();
  expectTypeOf(
    router.push({
      pathname: '/mix/[fruit]/[color]/[...animals]',
      params: { color: 1, fruit: 'apple', animals: [2, 'cat'] },
    })
  ).toEqualTypeOf<void>();
  expectTypeOf(
    router.push({
      pathname: '/mix/[fruit]/[color]/[...animals]',
      params: { color: 'red', fruit: 'apple', animals: [] },
    })
  ).toEqualTypeOf<void>();
  // @ts-expect-error not a known route
  router.push({ pathname: 'should-error' });
  // @ts-expect-error '/colors/[invalid]' is not a known route
  router.push({ pathname: '/colors/[invalid]', params: { color: 'blue' } });
  // @ts-expect-error 'invalid' is not a param of '/colors/[color]'
  router.push({ pathname: '/colors/[color]', params: { invalid: 'blue' } });
  // @ts-expect-error catch all params must be an array
  router.push({ pathname: '/animals/[...animal]', params: { animal: 'cat' } });
  router.push({
    pathname: '/mix/[fruit]/[color]/[...animals]',
    // @ts-expect-error the 'fruit' param is missing
    params: { color: 'red', animals: ['cat', 'dog'] },
  });

  // useLocalSearchParams / useGlobalSearchParams
  expectTypeOf(useLocalSearchParams<Record<'color', string>>()).toEqualTypeOf<Record<'color', string>>();
  expectTypeOf(useLocalSearchParams<'/colors/[color]'>()).toEqualTypeOf<UnknownOutputParams & { color: string }>();
  // @ts-expect-error '/invalid' is not a known route
  useLocalSearchParams<'/invalid'>();
  // @ts-expect-error params may not contain functions
  useLocalSearchParams<Record<'custom', Function>>();

  // useSegments
  expectTypeOf(useSegments<'/apple'>()).toEqualTypeOf<['apple']>();
  expectTypeOf(useSegments<['apple']>()).toEqualTypeOf<['apple']>();
  // @ts-expect-error '/invalid' is not a known route
  useSegments<'/invalid'>();
  // @ts-expect-error 'invalid segment' is not a known segment
  useSegments<['invalid segment']>();

  // External routes accept any url
  expectTypeOf(router.push('http://expo.dev')).toEqualTypeOf<void>();
  expectTypeOf(router.push('custom-schema://expo.dev')).toEqualTypeOf<void>();
  expectTypeOf(router.push('mailto:test@test.com')).toEqualTypeOf<void>();

  // router.setParams()
  expectTypeOf(router.setParams<'/folder/[slug]'>({ slug: 'test' })).toEqualTypeOf<void>();
  expectTypeOf(router.setParams<'/folder/[...slug]'>({ slug: ['test'] })).toEqualTypeOf<void>();
  expectTypeOf(router.setParams<'/folder/[slug]'>({ hello: 'world' })).toEqualTypeOf<void>();
  expectTypeOf(router.setParams({ hello: 'world' })).toEqualTypeOf<void>();
  // @ts-expect-error a single-segment param must be a string
  router.setParams<'/folder/[slug]'>({ slug: ['test'] });
  // @ts-expect-error a catch-all param must be an array
  router.setParams<'/folder/[...slug]'>({ slug: 'test' });
`;

it('enforces the generated route types', () => {
  const diagnostics = getTypeErrors({ 'routes.ts': routes, 'index.ts': assertions });
  expect(formatDiagnostics(diagnostics)).toBe('');
});
