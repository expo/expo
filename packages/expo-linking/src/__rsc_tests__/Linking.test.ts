import * as Linking from 'expo-linking';

it(`runs open URL`, async () => {
  await expect(Linking.openURL('https://www.google.com')).resolves.toBe(true);
});

it(`returns a shim initial URL`, async () => {
  expect(await Linking.getInitialURL()).toBe('');
});
