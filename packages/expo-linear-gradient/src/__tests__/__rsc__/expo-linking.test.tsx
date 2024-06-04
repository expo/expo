import * as Linking from 'expo-linking';

it(`Linking.parse works`, () => {
  expect(Linking.parse('exp://')).toEqual({
    hostname: null,
    path: null,
    queryParams: {},
    scheme: 'exp',
  });
});

it(`Linking.parse works`, async () => {
  expect(await Linking.canOpenURL('exp://')).toEqual(false);
});
it(`Linking.createURL works`, async () => {
  expect(await Linking.createURL('/hello')).toEqual('');
});
