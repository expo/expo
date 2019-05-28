import { NativeModulesProxy } from '@unimodules/core';

import {
  FocusPoint,
  Picture,
  TakingPictureOptions,
  Video,
  VideoRecordingOptions,
} from './ExpoCamera2.types';

type NodeHandle = number | undefined

const ExpoCamera2NativeViewManager: {
  // Lifecycles
  pausePreviewAsync: (cameraViewNodeHandle: NodeHandle) => Promise<void>;
  resumePreviewAsync: (cameraViewNodeHandle: NodeHandle) => Promise<void>;

  // Actions
  focusOnPoint: (previewFocusPoint: FocusPoint, cameraViewNodeHandle: NodeHandle) => Promise<boolean>;
  recordAsync: (options: VideoRecordingOptions, cameraViewNodeHandle: NodeHandle) => Promise<Video>;
  takePictureAsync: (options: TakingPictureOptions, cameraViewNodeHandle: NodeHandle) => Promise<Picture>;
  stopRecordingAsync: (cameraViewNodeHandle: NodeHandle) => Promise<void>;

  // Configuration
  getAvailablePictureSizesAsync: (ratio: string, cameraViewNodeHandle: NodeHandle) => Promise<string[]>;
  getAvailableRatiosAsync: (cameraViewNodeHandle: NodeHandle) => Promise<string[]>;

  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
} = NativeModulesProxy.ExpoCamera2ViewManager as any;

export default ExpoCamera2NativeViewManager;
