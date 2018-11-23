import { NativeModules } from 'react-native';
import UnsupportedError from './UnsupportedError';

const {
  ExponentImageManipulator = {
    get name() {
      return 'ExponentImageManipulator';
    },
  },
} = NativeModules;

type ImageResult = {
  uri: string;
  width: number;
  height: number;
  base64?: string;
};

type CropParameters = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

type ImageManipulationActions = {
  resize?: { width?: number; height?: number };
  rotate?: number;
  flip?: { vertical?: boolean; horizontal?: boolean };
  crop?: CropParameters;
};

type SaveOptions = {
  base64?: boolean;
  compress?: number;
  format?: 'jpeg' | 'png';
};

export async function manipulateAsync(
  uri: string,
  actions: ImageManipulationActions[] = [],
  saveOptions: SaveOptions = {}
): Promise<ImageResult> {
  if (!ExponentImageManipulator.manipulate) {
    throw new UnsupportedError('ImageManipulator', 'manipulateAsync');
  }
  if (!(typeof uri === 'string')) {
    throw new TypeError(`The "uri" argument must be a string`);
  }
  return ExponentImageManipulator.manipulate(uri, actions, saveOptions);
}
