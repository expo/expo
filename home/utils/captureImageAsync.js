import { ImagePicker } from 'expo';

import { requestCameraAysnc } from './PermissionUtils';

export default async function captureImageAsync() {
  const permission = await requestCameraAysnc();
  if (!permission) return;
  const { uri } = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
  });
  return uri;
}
