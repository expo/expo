import { expectTypeOf } from 'expect-type';
import { createServerLoader, createStaticLoader, json } from 'expo-server';

import { useLoaderData } from '../useLoaderData';

it('infers JSON payloads from synchronous and asynchronous loaders', () => {
  const data = { id: 1 };
  const loader = () => json(data);
  const asyncLoader = async () => json(data);

  expectTypeOf<ReturnType<typeof useLoaderData<typeof loader>>>().toEqualTypeOf<{ id: number }>();
  expectTypeOf<ReturnType<typeof useLoaderData<typeof asyncLoader>>>().toEqualTypeOf<{
    id: number;
  }>();
});

it('infers JSON payloads through both loader helpers', () => {
  const data = { id: 1 };
  const staticLoader = createStaticLoader(() => json(data));
  const serverLoader = createServerLoader(async () => json(data));

  expectTypeOf<ReturnType<typeof useLoaderData<typeof staticLoader>>>().toEqualTypeOf<{
    id: number;
  }>();
  expectTypeOf<ReturnType<typeof useLoaderData<typeof serverLoader>>>().toEqualTypeOf<{
    id: number;
  }>();
});

it('preserves unions of JSON responses and plain data', () => {
  const data = { id: 1 };
  const loader = () => (Math.random() ? json(data) : { error: 'missing' });

  expectTypeOf<ReturnType<typeof useLoaderData<typeof loader>>>().toEqualTypeOf<
    { id: number } | { error: string }
  >();
});

it('preserves literal payload types', () => {
  const data: { readonly id: 1 } = { id: 1 };
  const loader = () => json(data);

  expectTypeOf<ReturnType<typeof useLoaderData<typeof loader>>>().toEqualTypeOf<{
    readonly id: 1;
  }>();
});

it('keeps plain loader data and reads standard responses as untyped JSON', () => {
  const loader = async () => ({ id: 1 });
  const responseLoader = () => Response.json({ id: 1 });

  expectTypeOf<ReturnType<typeof useLoaderData<typeof loader>>>().toEqualTypeOf<{ id: number }>();
  expectTypeOf<ReturnType<typeof useLoaderData<typeof responseLoader>>>().toBeAny();
});
