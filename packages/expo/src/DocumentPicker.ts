import { NativeModules } from 'react-native';

type GetDocumentOptions = {
  copyToCacheDirectory?: boolean;
  type?: string;
};

export async function getDocumentAsync({
  copyToCacheDirectory = true,
  type = '*/*',
}: GetDocumentOptions = {}) {
  return await NativeModules.ExponentDocumentPicker.getDocumentAsync({
    copyToCacheDirectory,
    type,
  });
}
