import * as Permissions from 'expo-permissions';

// TODO(@skevy): weird formatting here...see https://github.com/jlongster/prettier/issues/700
export default (async function requestCameraPermissionsAsync(): Promise<boolean> {
  const { status } = await Permissions.askAsync(Permissions.CAMERA);
  return status === 'granted';
});
