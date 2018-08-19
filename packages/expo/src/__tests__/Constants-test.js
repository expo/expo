import { Constants } from 'expo-constants';

it(`defines a manifest`, () => {
  expect(Constants.manifest).toBeTruthy();
  expect(typeof Constants.manifest).toBe('object');
});

it(`defines a linking URI and URL`, () => {
  expect(typeof Constants.linkingUri).toBe('string');
  expect(Constants.linkingUri).toBe(Constants.linkingUrl);
});
