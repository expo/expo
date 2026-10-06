/* eslint-env browser */
import * as React from 'react';

import type {
  CameraReadyListener,
  CameraType,
  MountErrorListener,
  WebCameraSettings,
} from '../Camera.types';
import * as Utils from './WebCameraUtils';
import { FacingModeToCameraType } from './WebConstants';

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
] as const;

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
    zoom: 0,
  });
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  const mediaTrackSettings = React.useMemo(() => {
    return stream?.getTracks()[0]?.getSettings() ?? null;
  }, [stream]);

  // The actual camera type - this can be different from the incoming camera type.
  const type = React.useMemo(() => {
    if (!mediaTrackSettings) {
      return null;
    }
    if (mediaTrackSettings.facingMode) {
      return FacingModeToCameraType[mediaTrackSettings.facingMode] ?? null;
    }
    // On desktop no value will be returned, in this case we should assume the cameraType is 'front',
    // unless the camera's label says otherwise (e.g. "Microsoft Camera Rear" on Windows).
    const label = stream?.getTracks()[0]?.label ?? '';
    return Utils.labelMatchesCameraType(label, 'back') ? 'back' : 'front';
  }, [stream, mediaTrackSettings]);

  const getStreamDeviceAsync = React.useCallback(async (): Promise<MediaStream | null> => {
    try {
      return await Utils.getPreferredStreamDevice(preferredType);
    } catch (nativeEvent: any) {
      if (__DEV__) {
        console.warn(`Error requesting UserMedia for type "${preferredType}":`, nativeEvent);
      }
      onMountError?.({ nativeEvent });
      return null;
    }
  }, [preferredType, onMountError]);

  const getOtherStreamDeviceAsync = React.useCallback(async (): Promise<MediaStream | null> => {
    const activeDeviceId = stream?.getTracks()[0]?.getSettings().deviceId;
    if (!activeDeviceId) {
      return null;
    }
    try {
      return await Utils.getOtherStreamDevice(preferredType, activeDeviceId);
    } catch (error) {
      if (__DEV__) {
        console.warn(`Error switching to another camera for type "${preferredType}":`, error);
      }
      return null;
    }
  }, [preferredType, stream]);

  const resumeAsync = React.useCallback(async (): Promise<boolean> => {
    let nextStream = await getStreamDeviceAsync();
    if (Utils.compareStreams(nextStream, stream)) {
      // The browser returned the camera that is already active. This happens when the device only
      // supports one camera (i.e. desktop), or when the browser can't select a camera by `facingMode`
      // because the camera drivers don't report it (e.g. on Windows).
      // Close the duplicate stream and explicitly switch to another camera, if there is one.
      Utils.stopMediaStream(nextStream);
      nextStream = await getOtherStreamDeviceAsync();
      if (!nextStream) {
        // Do nothing if there is no other camera.
        // Without this check there is a screen flash while the video switches.
        return false;
      }
    }

    // Save a history of all active streams (usually 2+) so we can close them later.
    // Keeping them open makes swapping camera types much faster.
    if (!activeStreams.current.some((value) => value.id === nextStream?.id)) {
      activeStreams.current.push(nextStream!);
    }

    setStream(nextStream);
    return false;
  }, [getStreamDeviceAsync, getOtherStreamDeviceAsync, setStream, stream, activeStreams.current]);

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

    for (const key of VALID_SETTINGS_KEYS) {
      if (key in settings) {
        const nextValue = settings[key];
        if (nextValue !== capabilities.current[key]) {
          changes[key] = nextValue;
        }
      }
    }

    const hasChanges = Object.keys(changes).length > 0;
    if (hasChanges) {
      Utils.syncTrackCapabilities(preferredType, stream, changes);
    }

    capabilities.current = { ...capabilities.current, ...changes };
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

  const onCameraReadyRef = React.useRef(onCameraReady);
  onCameraReadyRef.current = onCameraReady;

  React.useEffect(() => {
    // set or unset the video source.
    const element = video.current;
    if (!element) {
      return;
    }
    Utils.setVideoSource(element, stream);
    if (!stream) {
      return;
    }

    // Only report the camera as ready once the video has a frame to capture,
    // otherwise `takePictureAsync` would throw `ERR_CAMERA_NOT_READY`.
    const readyEvents = ['loadeddata', 'canplay', 'canplaythrough', 'playing'] as const;
    const onVideoReady = () => {
      if (!Utils.isVideoReadyForCapture(element)) {
        return;
      }
      removeListeners();
      onCameraReadyRef.current?.();
    };
    const removeListeners = () => {
      for (const event of readyEvents) {
        element.removeEventListener(event, onVideoReady);
      }
    };
    for (const event of readyEvents) {
      element.addEventListener(event, onVideoReady);
    }
    onVideoReady();
    return removeListeners;
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
