/* eslint-env browser */
import { Platform } from 'expo-modules-core';

async function sourceSelectedAsync(
  isMuted: boolean,
  audioConstraints?: MediaTrackConstraints | boolean,
  videoConstraints?: MediaTrackConstraints | boolean
): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    video: typeof videoConstraints !== 'undefined' ? videoConstraints : true,
  };

  if (!isMuted) {
    constraints.audio = typeof audioConstraints !== 'undefined' ? audioConstraints : true;
  }

  return await getAnyUserMediaAsync(constraints);
}

export async function requestUserMediaAsync(
  props: { audio?: any; video?: any },
  isMuted: boolean = true
): Promise<MediaStream> {
  return await sourceSelectedAsync(isMuted, props.audio, props.video);
}

export async function getAnyUserMediaAsync(
  constraints: MediaStreamConstraints,
  ignoreConstraints: boolean = false
): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      ...constraints,
      video: ignoreConstraints || constraints.video,
    });
  } catch (error: any) {
    if (
      !ignoreConstraints &&
      typeof error === 'object' &&
      error?.name === 'ConstraintNotSatisfiedError'
    ) {
      return await getAnyUserMediaAsync(constraints, true);
    }
    throw error;
  }
}

export function canGetUserMedia(): boolean {
  return Platform.isDOMAvailable && !!navigator.mediaDevices?.getUserMedia;
}

export async function isFrontCameraAvailableAsync(
  devices?: MediaDeviceInfo[]
): Promise<null | string> {
  return await supportsCameraType(['front', 'user', 'facetime'], 'user', devices);
}

export async function isBackCameraAvailableAsync(
  devices?: MediaDeviceInfo[]
): Promise<null | string> {
  return await supportsCameraType(['back', 'rear'], 'environment', devices);
}

async function supportsCameraType(
  labels: string[],
  type: string,
  devices?: MediaDeviceInfo[]
): Promise<null | string> {
  if (!devices) {
    if (!navigator.mediaDevices.enumerateDevices) {
      return null;
    }
    devices = await navigator.mediaDevices.enumerateDevices();
  }
  const cameras = devices.filter((t) => t.kind === 'videoinput');
  const [hasCamera] = cameras.filter((camera) =>
    labels.some((label) => camera.label.toLowerCase().includes(label))
  );
  const [isCapable] = cameras.filter((camera) => {
    if (!('getCapabilities' in camera)) {
      return null;
    }

    const capabilities = (camera as any).getCapabilities();
    if (!capabilities.facingMode) {
      return null;
    }

    return capabilities.facingMode.find((_: string) => type);
  });

  return isCapable?.deviceId || hasCamera?.deviceId || null;
}
