export enum CameraType {
  front = 'front',
  back = 'back',
}

export enum ImageType {
  png = 'png',
  jpg = 'jpg',
}

export type ImageParameters = {
  imageType: ImageType;
  quality: number | null;
};

export type ImageSize = {
  width: number;
  height: number;
};

export type CaptureOptions = {
  quality?: number;
  exif?: boolean;
  onPictureSaved?: Function;
  skipProcessing?: boolean; // TODO: Bacon: IMP
  //Web
  scale: number;
  imageType: ImageType;
  isImageMirror: boolean;
};

export type CapturedPicture = {
  width: number;
  height: number;
  uri: string;
  base64?: string;
  exif?: any;
};
