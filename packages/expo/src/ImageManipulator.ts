import { NativeModules } from 'react-native';

const { ExponentImageManipulator } = NativeModules;

type ImageResult = {
  uri: string,
  width: number,
  height: number,
  base64?: string,
};

type CropParameters = {
  originX: number,
  originY: number,
  width: number,
  height: number,
};

type ImageManipulationActions = {
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
  actions: ImageManipulationActions[] = [],
  saveOptions: SaveOptions = {}
): Promise<ImageResult> {
  // Remove in SDK 32+
  console.warn(`ImageManipulator.manipulate is deprecated in favor of manipulateAsync, which has the same API except for the method name`);
  return manipulateAsync(uri, actions, saveOptions);
}

export async function manipulateAsync(
  uri: string,
  actions: ImageManipulationActions[] = [],
  saveOptions: SaveOptions = {}
): Promise<ImageResult> {
  if (!(typeof uri === 'string')) {
    throw new TypeError(`The "uri" argument must be a string`);
  }
  return ExponentImageManipulator.manipulate(uri, actions, saveOptions);
}
