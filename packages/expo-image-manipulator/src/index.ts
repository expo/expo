import { NativeModulesProxy } from 'expo-core';

const { ExpoImageManipulator } = NativeModulesProxy;

type ImageResult = {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

type ActionResize = {
  resize: {
    width?: number;
    height?: number;
  };
}

type ActionRotate = {
  rotate: number;
}

type ActionFlip = {
  flip: { vertical: boolean; } | { horizontal: boolean; };
}

type ActionCrop = {
  crop: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
}

type Action = ActionResize | ActionRotate | ActionFlip | ActionCrop;

interface SaveOptions {
  base64?: boolean;
  compress?: number;
  format?: 'jpeg' | 'png';
};

export async function manipulateAsync(
  uri: string,
  actions: Action[] = [],
  saveOptions: SaveOptions = { format: 'jpeg' },
): Promise<ImageResult> {
  if (!(typeof uri === 'string')) {
    throw new TypeError('The "uri" argument must be a string');
  }
  return await ExpoImageManipulator.manipulateAsync(uri, actions, saveOptions);
}
