import { json, type TypedResponse } from '../index';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

interface User {
  id: number;
}

interface Payload {
  user: User;
}

export function jsonInterfacePayload(data: Payload) {
  return json(data);
}

export type InterfaceBody = Expect<
  Equal<Awaited<ReturnType<ReturnType<typeof jsonInterfacePayload>['json']>>, Payload>
>;

export type JsonBody = Expect<
  Equal<Awaited<ReturnType<TypedResponse<{ id: number }>['json']>>, { id: number }>
>;
export type ClonedJsonBody = Expect<
  Equal<ReturnType<TypedResponse<{ id: number }>['clone']>, TypedResponse<{ id: number }>>
>;

it('returns a standard Response with the JSON body, status, and headers', async () => {
  const response: Response = json(
    { id: 1 },
    {
      status: 201,
      headers: { 'Cache-Control': 'private, max-age=60' },
    }
  );

  expect(response).toBeInstanceOf(Response);
  expect(response.status).toBe(201);
  expect(response.headers.get('Content-Type')).toBe('application/json');
  expect(response.headers.get('Cache-Control')).toBe('private, max-age=60');
  expect(await response.json()).toEqual({ id: 1 });
});

it('preserves the body when cloned', async () => {
  const response = json({ id: 1 });
  const clone = response.clone();

  expect(await clone.json()).toEqual({ id: 1 });
  expect(await response.json()).toEqual({ id: 1 });
});

it('supports null, primitives, arrays, and readonly values', async () => {
  expect(await json(null).json()).toBeNull();
  expect(await json('value').json()).toBe('value');
  expect(await json(42).json()).toBe(42);
  expect(await json(false).json()).toBe(false);
  expect(await json([{ id: 1 }, null] as const).json()).toEqual([{ id: 1 }, null]);
});

// These calls are checked by tsc but must not execute during the runtime tests.
export function invalidJsonInputs() {
  // @ts-expect-error Dates serialize to strings and must be converted explicitly.
  json({ date: new Date() });
  // @ts-expect-error BigInts cannot be serialized as JSON.
  json({ id: 1n });
  // @ts-expect-error Functions are not JSON values.
  json({ fn: () => 1 });
  // @ts-expect-error Undefined is not a JSON value.
  json(undefined);
}
