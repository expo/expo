import { getAbsolutePath } from '../createEntryFile';

beforeEach(() => {
  delete process.env.EXPO_ROUTER_ABS_APP_ROOT;
});

it(`returns correct absolute path for standard projects`, () => {
  process.env.EXPO_ROUTER_ABS_APP_ROOT = '/path/to/expo/project/app';
  expect(getAbsolutePath()).toEqual('/path/to/expo/project/app/index.js');
});
it(`returns correct absolute path for standard projects with src dir`, () => {
  process.env.EXPO_ROUTER_ABS_APP_ROOT = '/path/to/expo/project/src/app';
  expect(getAbsolutePath()).toEqual('/path/to/expo/project/src/app/index.js');
});
