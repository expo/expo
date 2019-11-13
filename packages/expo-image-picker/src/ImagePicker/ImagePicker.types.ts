import { PermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';

export enum MediaTypeOptions {
  All = 'All',
  Videos = 'Videos',
  Images = 'Images',
}

export type NativeImageInfo = {
  type: 'image';
  uri: string;
  width: number;
  height: number;
  exif?: Record<string, any>;
  base64?: string;
};

export type NativeVideoInfo = {
  type: 'video';
  uri: string;
  width: number;
  height: number;
  duration: number;
};

export type WebImageInfo = {
  uri: string;
  width: 0;
  height: 0;
};

export type ImageInfo = NativeImageInfo | NativeVideoInfo | WebImageInfo;

export type ImagePickerResult = { cancelled: true } | ({ cancelled: false } & ImageInfo);

export type ImagePickerOptions = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
  mediaTypes?: MediaTypeOptions;
  exif?: boolean;
  base64?: boolean;
};

export type OpenFileBrowserOptions = {
  mediaTypes: MediaTypeOptions;
  capture?: boolean;
  allowsMultipleSelection: boolean;
};

export { PermissionResponse, PermissionStatus };
