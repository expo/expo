import { createSnapshotFriendlyRef } from 'expo-modules-core';

describe('Refs', () => {
  it('refs should be snapshot friendly', () => {
    expect(createSnapshotFriendlyRef()).toMatchSnapshot();
  });
});
