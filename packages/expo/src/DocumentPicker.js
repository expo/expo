// @flow

import { NativeModules } from 'react-native';

type GetDocumentOptions = {
  type?: string,
};

export async function getDocumentAsync({ type = '*/*' }: GetDocumentOptions = {}) {
  return await NativeModules.ExponentDocumentPicker.getDocumentAsync({ type });
}
