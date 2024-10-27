/* eslint-env browser */
import * as React from 'react';

import * as Utils from './WebCameraUtils';
import { FacingModeToCameraType } from './WebConstants';
import {
  CameraReadyListener,
  CameraType,
  MountErrorListener,
  WebCameraSettings,
} from '../Camera.types';

const VALID_SETTINGS_KEYS = [
  'autoFocus',
  'flashMode',
  'exposureCompensation',
  'colorTemperature',
  'iso',
  'brightness',
  'contrast',
  'saturation',
  'sharpness',
  'focusDistance',
  'whiteBalance',
  'zoom',
];

function useLoadedVideo(video: HTMLVideoElement | null, onLoaded: () => void) {
  React.useEffect(() => {
    if (video) {
      video.addEventListener('loadedmetadata', () => {
        // without this async block the constraints aren't properly applied to the camera,
        // this means that if you were to turn on the torch and swap to the front camera,
        // then swap back to the rear camera the torch setting wouldn't be applied.
        requestAnimationFrame(() => {
          onLoaded();
        });
      });
    }
  }, [video]);
}

export function useWebCameraStream(
  video: React.MutableRefObject<HTMLVideoElement | null>,
  preferredType: CameraType,
  settings: Record<string, any>,
  {
    onCameraReady,
    onMountError,
  }: { onCameraReady?: CameraReadyListener; onMountError?: MountErrorListener }
): {
  type: CameraType | null;
  mediaTrackSettings: MediaTrackSettings | null;
} {
  const isStartingCamera = React.useRef<boolean | null>(false);
  const activeStreams = React.useRef<MediaStream[]>([]);
  const capabilities = React.useRef<WebCameraSettings>({
    autoFocus: 'continuous',
    flashMode: 'off',
    whiteBalance: 'continuous',
    zoom: 1,
  });
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  const mediaTrackSettings = React.useMemo(() => {
    return stream ? stream.getTracks()[0].getSettings() : null;
  }, [stream]);

  // The actual camera type - this can be different from the incoming camera type.
  const type = React.useMemo(() => {
    if (!mediaTrackSettings) {
      return null;
    }
    // On desktop no value will be returned, in this case we should assume the cameraType is 'front'
    const { facingMode = 'user' } = mediaTrackSettings;
    return FacingModeToCameraType[facingMode];
  }, [mediaTrackSettings]);

  const getStreamDeviceAsync = React.useCallback(async (): Promise<MediaStream | null> => {
    try {
      return await Utils.getPreferredStreamDevice(preferredType);
    } catch (nativeEvent) {
      if (__DEV__) {
        console.warn(`Error requesting UserMedia for type "${preferredType}":`, nativeEvent);
      }
      if (onMountError) {
        onMountError({ nativeEvent });
      }
      return null;
    }
  }, [preferredType, onMountError]);

  const resumeAsync = React.useCallback(async (): Promise<boolean> => {
    const nextStream = await getStreamDeviceAsync();
    if (Utils.compareStreams(nextStream, stream)) {
      // Do nothing if the streams are the same.
      // This happens when the device only supports one camera (i.e. desktop) and the mode was toggled between front/back while already active.
      // Without this check there is a screen flash while the video switches.
      return false;
    }

    // Save a history of all active streams (usually 2+) so we can close them later.
    // Keeping them open makes swapping camera types much faster.
    if (!activeStreams.current.some((value) => value.id === nextStream?.id)) {
      activeStreams.current.push(nextStream!);
    }

    // Set the new stream -> update the video, settings, and actual camera type.
    setStream(nextStream);
    if (onCameraReady) {
      onCameraReady();
    }
    return false;
  }, [getStreamDeviceAsync, setStream, onCameraReady, stream, activeStreams.current]);

  React.useEffect(() => {
    // Restart the camera and guard concurrent actions.
    if (isStartingCamera.current) {
      return;
    }
    isStartingCamera.current = true;

    resumeAsync()
      .then((isStarting) => {
        isStartingCamera.current = isStarting;
      })
      .catch(() => {
        // ensure the camera can be started again.
        isStartingCamera.current = false;
      });
  }, [preferredType]);

  // Update the native camera with any custom capabilities.
  React.useEffect(() => {
    const changes: WebCameraSettings = {};

    for (const key of Object.keys(settings)) {
      if (!VALID_SETTINGS_KEYS.includes(key)) {
        continue;
      }
      const nextValue = settings[key];
      if (nextValue !== capabilities.current[key]) {
        changes[key] = nextValue;
      }
    }

    // Only update the native camera if changes were found
    const hasChanges = !!Object.keys(changes).length;

    const nextWebCameraSettings = { ...capabilities.current, ...changes };
    if (hasChanges) {
      Utils.syncTrackCapabilities(preferredType, stream, changes);
    }

    capabilities.current = nextWebCameraSettings;
  }, [
    settings.autoFocus,
    settings.flashMode,
    settings.exposureCompensation,
    settings.colorTemperature,
    settings.iso,
    settings.brightness,
    settings.contrast,
    settings.saturation,
    settings.sharpness,
    settings.focusDistance,
    settings.whiteBalance,
    settings.zoom,
  ]);

  React.useEffect(() => {
    // set or unset the video source.
    if (!video.current) {
      return;
    }
    Utils.setVideoSource(video.current, stream);
  }, [video.current, stream]);

  React.useEffect(() => {
    return () => {
      // Clean up on dismount, this is important for making sure the camera light goes off when the component is removed.
      for (const stream of activeStreams.current) {
        // Close all open streams.
        Utils.stopMediaStream(stream);
      }
      if (video.current) {
        // Invalidate the video source.
        Utils.setVideoSource(video.current, stream);
      }
    };
  }, []);

  // Update props when the video loads.
  useLoadedVideo(video.current, () => {
    Utils.syncTrackCapabilities(preferredType, stream, capabilities.current);
  });

  return {
    type,
    mediaTrackSettings,
  };
}
