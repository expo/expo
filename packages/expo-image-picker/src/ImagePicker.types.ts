import { PermissionResponse } from 'unimodules-permissions-interface';

export { PermissionResponse as CameraPermissionResponse };

export type CameraRollPermissionResponse = PermissionResponse & {
  // iOS only
  accessPrivileges?: 'all' | 'limited' | 'none';
};

export enum MediaTypeOptions {
  All = 'All',
  Videos = 'Videos',
  Images = 'Images',
}

export enum VideoExportPreset {
  Passthrough = 0,
  LowQuality = 1,
  MediumQuality = 2,
  HighestQuality = 3,
  H264_640x480 = 4,
  H264_960x540 = 5,
  H264_1280x720 = 6,
  H264_1920x1080 = 7,
  H264_3840x2160 = 8,
  HEVC_1920x1080 = 9,
  HEVC_3840x2160 = 10,
}

export type ImageInfo = {
  uri: string;
  width: number;
  height: number;
  type?: 'image' | 'video';
  exif?: { [key: string]: any };
  base64?: string;
};

export type ImagePickerResult = { cancelled: true } | ({ cancelled: false } & ImageInfo);

export type ImagePickerMultipleResult =
  | { cancelled: true }
  | { cancelled: false; selected: ImageInfo[] };

export type ImagePickerOptions = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: MediaTypeOptions;
  exif?: boolean;
  base64?: boolean;
  videoExportPreset?: VideoExportPreset;
  allowsMultipleSelection?: boolean;
  videoMaxDuration?: number;
};

export type OpenFileBrowserOptions = {
  mediaTypes: MediaTypeOptions;
  capture?: boolean;
  allowsMultipleSelection: boolean;
};

export type ExpandImagePickerResult<
  T extends ImagePickerOptions | OpenFileBrowserOptions
> = T extends {
  allowsMultipleSelection: true;
}
  ? ImagePickerMultipleResult
  : ImagePickerResult;
