import documentPickerPlugin from '../index';

describe('typed plugin', () => {
  it('forwards props to the config plugin entry', () => {
    expect(documentPickerPlugin({ iCloudContainerEnvironment: 'Production' })).toEqual([
      'expo-document-picker',
      { iCloudContainerEnvironment: 'Production' },
    ]);
  });

  it('defaults to empty props', () => {
    expect(documentPickerPlugin()).toEqual(['expo-document-picker', {}]);
  });
});
