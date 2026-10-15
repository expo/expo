/// <reference types="jest-expo/rsc/expect" />

import Stack, { createJSStackProps } from '../JSStack';

it('resolves createJSStackProps as a client reference', () => {
  expect((createJSStackProps as { $$typeof?: symbol }).$$typeof).toBe(
    Symbol.for('react.client.reference')
  );
});

it(`renders to RSC`, async () => {
  const jsx = <Stack.Screen options={{ title: '...' }} />;

  await expect(jsx).toMatchFlightSnapshot();
});
