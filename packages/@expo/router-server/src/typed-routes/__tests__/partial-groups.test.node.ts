import { inMemoryContext } from 'expo-router/internal/testing';

import { getTypedRoutesDeclarationFile } from '../generate';
import { formatDiagnostics, getTypeErrors, ts } from './tsHarness';

const routes = getTypedRoutesDeclarationFile(
  inMemoryContext({
    '/(group)/static': () => null,
    '/(group)/(a,b)/folder/index': () => null,
    '/(group)/(a,b)/folder/[slug]': () => null,
    '/(group)/(a,b)/folder/[...slug]': () => null,
  }),
  { partialTypedGroups: true, testIgnoreComments: true }
);

const assertions = ts`
  import { expectTypeOf } from 'expect-type';
  import type { Href, RouteParams } from './routes';
  import { useRouter } from './routes';

  const router = useRouter();

  // Partial group routes (a group segment omitted) are valid Hrefs
  expectTypeOf('/(a)/folder/slug1' as const).toExtend<Href>();
  expectTypeOf('/(group)/folder/slug1' as const).toExtend<Href>();
  expectTypeOf({
    pathname: '/(group)/folder/[slug]',
    params: { slug: 'slug12' },
  } as const).toExtend<Href>();
  expectTypeOf({
    pathname: '/(b)/folder/[slug]',
    params: { slug: 'slug12' },
  } as const).toExtend<Href>();

  // Partial group routes work through the imperative API
  expectTypeOf(router.push('/(a)/folder/slug1')).toEqualTypeOf<void>();
  expectTypeOf(router.push('/(group)/folder/slug1')).toEqualTypeOf<void>();
  expectTypeOf(
    router.push({ pathname: '/(a)/folder/[slug]', params: { slug: 'value', query: 'true' } })
  ).toEqualTypeOf<void>();
  expectTypeOf(
    router.push({ pathname: '/(group)/folder/[slug]', params: { slug: 'value', query: 'true' } })
  ).toEqualTypeOf<void>();

  // RouteParams enforces the segment arity
  expectTypeOf({ slug: ['slug1', 'slug2'], query: 'true' }).toExtend<RouteParams<'/(a)/folder/[...slug]'>>();
  // You cannot assign an array to a single value
  expectTypeOf({ slug: ['slug1', 'slug2'] }).not.toExtend<RouteParams<'/(a)/folder/[slug]'>>();
  // You cannot assign a single value to an array
  expectTypeOf({ slug: 'slug1' }).not.toExtend<RouteParams<'/(a)/folder/[...slug]'>>();
`;

it('enforces the generated partial-group route types', () => {
  const diagnostics = getTypeErrors({ 'routes.ts': routes, 'index.ts': assertions });
  expect(formatDiagnostics(diagnostics)).toBe('');
});
