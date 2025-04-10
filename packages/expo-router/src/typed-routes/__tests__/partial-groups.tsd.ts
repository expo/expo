import { expectType, expectAssignable, expectNotAssignable } from 'tsd-lite';

import { useRouter, Href, RouteParams } from './fixtures/partialGroups';

test('Partial Groups - Href', () => {
  // Partial route (missing first segment)
  expectAssignable<Href>('/(a)/folder/slug1');
  // Partial route (missing second segment)
  expectAssignable<Href>('/(group)/folder/slug1');

  // Partial route (missing first segment)
  expectAssignable<Href>({
    pathname: '/(group)/folder/[slug]',
    params: {
      slug: 'slug12',
    },
  } as const);

  // Partial route (missing second segment)
  expectAssignable<Href>({
    pathname: '/(b)/folder/[slug]',
    params: {
      slug: 'slug12',
    },
  } as const);
});

test('Partial Groups - imperative API', () => {
  const router = useRouter();

  // Partial route (missing first segment)
  expectType<void>(router.push('/(a)/folder/slug1'));
  // Partial route (missing second segment)
  expectType<void>(router.push('/(group)/folder/slug1'));

  // Partial route (missing first segment)
  expectType<void>(
    router.push({ pathname: '/(a)/folder/[slug]', params: { slug: 'value', query: 'true' } })
  );
  // Partial route (missing second segment)
  expectType<void>(
    router.push({ pathname: '/(group)/folder/[slug]', params: { slug: 'value', query: 'true' } })
  );
});

test('RouteParams - missing segments', () => {
  expectAssignable<RouteParams<'/(a)/folder/[...slug]'>>({
    slug: ['slug1', 'slug2'],
    query: 'true',
  });

  // You cannot assign an array to a single value
  expectNotAssignable<RouteParams<'/(a)/folder/[slug]'>>({
    slug: ['slug1', 'slug2'],
  });

  // You cannot assign a single value to an array
  expectNotAssignable<RouteParams<'/(a)/folder/[...slug]'>>({
    slug: 'slug1',
  });
});
