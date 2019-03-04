export type ImageResult = {
  uri: string;
  width: number;
  height: number;
  base64?: string;
};

export type ActionResize = {
  resize: {
    width?: number;
    height?: number;
  };
};

export type ActionRotate = {
  rotate: number;
};

export enum FlipType {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
}

export type ActionFlip = {
  flip: FlipType;
};

export type ActionCrop = {
  crop: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
};

export type Action = ActionResize | ActionRotate | ActionFlip | ActionCrop;

export enum SaveFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  // Chrome
  WEBP = 'webp',
}

export interface SaveOptions {
  base64?: boolean;
  compress?: number;
  format?: SaveFormat;
}
