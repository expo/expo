import * as Font from 'expo-font';

it('loads the font module without throwing', async () => {
  await Font.loadAsync({});
});
