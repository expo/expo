export type ImageResult = {
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

export enum FlipType {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

type ActionFlip = {
  flip: FlipType;
}

type ActionCrop = {
  crop: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
}

export type Action = ActionResize | ActionRotate | ActionFlip | ActionCrop;

export enum SaveFormat {
  JPEG = 'jpeg',
  PNG = 'png',
}

export interface SaveOptions {
  base64?: boolean;
  compress?: number;
  format?: SaveFormat;
};
