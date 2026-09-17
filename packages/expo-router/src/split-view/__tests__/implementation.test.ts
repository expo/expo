import { getSplitViewImplementation, setSplitViewImplementation } from '../implementation';

afterEach(() => {
  setSplitViewImplementation('rns');
});

it('uses react-native-screens by default', () => {
  expect(getSplitViewImplementation()).toBe('rns');
});

it('switches to the selected implementation', () => {
  setSplitViewImplementation('expo-ui');
  expect(getSplitViewImplementation()).toBe('expo-ui');

  setSplitViewImplementation('rns');
  expect(getSplitViewImplementation()).toBe('rns');
});
