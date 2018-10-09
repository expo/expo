import { FileSystem } from 'expo';

// TODO: Evan: Is it worth the bloat?
async function readAsStringAsync(localUri: string): ?string {
  if (global.__expo_three_log_loading) {
    console.time('loadAsset');
    console.log('Load local file', localUri);
  }
  let file;
  try {
    file = await FileSystem.readAsStringAsync(localUri);
  } catch ({ message }) {
    console.error(
      'Error: ExpoTHREE: Expo.FileSystem.readAsStringAsync:',
      message
    );
  } finally {
    if (global.__expo_three_log_loading) {
      console.timeEnd('loadAsset');
    }
    return file;
  }
}

export default readAsStringAsync;
