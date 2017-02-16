import { Permissions } from 'exponent';

export default (async function requestCameraPermissionsAsync() {
  let { status } = await Permissions.askAsync(Permissions.CAMERA);
  return status === 'granted';
});
