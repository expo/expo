import * as Font from 'expo-font';

describe('Font in RSC env', () => {
  it('loads the font module without throwing', async () => {
    await expect(Font.loadAsync({})).resolves.toBeUndefined();
  });

  it('useFonts returns loaded: false', async () => {
    expect(Font.useFonts({})).toEqual([false, null]);
  });
});
