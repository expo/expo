// @flow

import { NativeModules } from 'react-native';

const { ExponentImageManipulator } = NativeModules;

type ImageResult = {|
  uri: string,
  width: number,
  height: number,
  base64?: string,
|};

type CropParameters = {
  originX: number,
  originY: number,
  width: number,
  height: number,
};

type ImageManipulationOptions = {
  resize?: { width?: number, height?: number },
  rotate?: number,
  flip?: { vertical?: boolean, horizontal?: boolean },
  crop?: CropParameters,
};

type SaveOptions = {
  base64?: boolean,
  compress?: number,
  format?: 'jpeg' | 'png',
};

export async function manipulate(
  uri: string,
  actions: ImageManipulationOptions[] = [],
  saveOptions?: SaveOptions = {}
): Promise<ImageResult> {
  if (!(typeof uri === 'string' || uri instanceof String)) {
    throw new Error('Invalid type provided as uri parameter.');
  }
  return ExponentImageManipulator.manipulate(uri, actions, saveOptions);
}
