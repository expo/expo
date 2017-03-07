/* @flow */

import { Permissions } from 'expo';

// TODO(@skevy): weird formatting here...see https://github.com/jlongster/prettier/issues/700
export default (async function requestCameraPermissionsAsync() {
  let { status } = await Permissions.askAsync(Permissions.CAMERA);
  return status === 'granted';
});
