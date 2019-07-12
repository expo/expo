import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Permissions from 'expo-permissions';

const mediaOptions = {
  allowsEditing: true,
  quality: 1.0,
  allowsMultipleSelection: false,
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  exif: false,
  base64: false,
};

const directory = `${FileSystem.documentDirectory}/photos`;

async function ensurePermissionsAsync(): Promise<boolean> {
  const { status } = await Permissions.askAsync(Permissions.CAMERA, Permissions.CAMERA_ROLL);
  if (status !== Permissions.PermissionStatus.GRANTED) {
    alert(
      'Cannot select a banner photo without media access! Please enable the "Camera" & "Camera Roll" permission in your system settings.'
    );
    return false;
  }
  return true;
}

export async function takePhotoAsync(): Promise<string | null> {
  if (!(await ensurePermissionsAsync())) return null;

  const media = await ImagePicker.launchCameraAsync(mediaOptions);
  if (!media.cancelled) {
    const asset = await MediaLibrary.createAssetAsync(media.uri);
    return await moveToPhotoCacheAsync(asset.uri);
  }
  return null;
}

export async function choosePhotoAsync(): Promise<string | null> {
  if (!(await ensurePermissionsAsync())) return null;

  const media = await ImagePicker.launchImageLibraryAsync(mediaOptions);
  if (!media.cancelled) {
    return await moveToPhotoCacheAsync(media.uri);
  }
  return null;
}

async function moveToPhotoCacheAsync(uri: string): Promise<string> {
  await ensureDirectory(directory);
  const extension = getExtension(uri);
  const cachedFileName = `${Date.now()}.${extension}`;
  const cachedFileLocation = `${directory}/${cachedFileName}`;
  await FileSystem.copyAsync({
    from: uri,
    to: cachedFileLocation,
  });
  return cachedFileLocation;
}

async function ensureDirectory(directory: string): Promise<void> {
  try {
    await FileSystem.makeDirectoryAsync(directory);
  } catch (error) {}
}

function getExtension(url: string): string {
  const components = url.split('.');
  const last = components.pop();
  if (!last) throw new Error(`Failed to extract file extension for: ${url}`);
  return last
    .split('?')[0]
    .split('#')[0]
    .toLowerCase();
}
