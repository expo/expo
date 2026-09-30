import { unstable_navigationEvents } from '..';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

it('exposes a readonly version without a top-level version export', () => {
  const readonlyCheck: Equal<
    Pick<typeof unstable_navigationEvents, 'version'>,
    { readonly version: number }
  > = true;
  expect(readonlyCheck).toBe(true);
  expect(unstable_navigationEvents.version).toBe(1);
  expect(Object.keys(require('../../exports'))).not.toContain('NAVIGATION_EVENTS_API_VERSION');
});
