import * as NativeTabsEntry from '..';

describe('expo-router/unstable-native-tabs exports', () => {
  it('exports the native tabs props helper', () => {
    expect(NativeTabsEntry.createNativeTabsProps).toBeDefined();
  });
});
