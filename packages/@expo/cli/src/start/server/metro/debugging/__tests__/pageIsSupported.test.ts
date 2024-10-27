import { pageIsSupported } from '../pageIsSupported';

it('returns true for synthetic reloadable page', () => {
  expect(
    pageIsSupported({
      title: 'React Native Experimental (Improved Chrome Reloads)',
      capabilities: {},
    })
  ).toBe(true);
});

it('returns true for page with native reload capabilities', () => {
  expect(
    pageIsSupported({
      title: 'Hermes React Native',
      capabilities: { nativePageReloads: true },
    })
  ).toBe(true);
});

it('returns false for page without native reload capabilities', () => {
  expect(
    pageIsSupported({
      title: 'Hermes React Native',
      capabilities: { nativePageReloads: false },
    })
  ).toBe(false);

  expect(
    pageIsSupported({ title: 'Hermes React Native', capabilities: { capabilities: {} } })
  ).toBe(false);
});
