import { getOrPromptForBundleIdentifierAsync } from '../getOrPromptApplicationId';

jest.mock('../../log');
jest.mock('../interactive', () => ({ isInteractive: () => false }));
jest.mock('../validateApplicationId', () => ({
  ...jest.requireActual('../validateApplicationId'),
  getBundleIdWarningAsync: jest.fn(async () => 'The bundle identifier is already in use.'),
}));

it('names the config field when the recommended bundle identifier is in use in non-interactive mode', async () => {
  await expect(
    getOrPromptForBundleIdentifierAsync('/', {
      name: 'App',
      slug: 'app',
      android: { package: 'com.example.app' },
    })
  ).rejects.toThrow(
    'Project must have a `ios.bundleIdentifier` set in the Expo config (app.json or app.config.js).'
  );
});
