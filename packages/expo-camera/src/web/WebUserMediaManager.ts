/* eslint-env browser */
/**
 * A web-only module for ponyfilling the UserMedia API.
 */
import { Platform } from 'expo-modules-core';

export const userMediaRequested: boolean = false;

export const mountedInstances: any[] = [];

async function requestLegacyUserMediaAsync(props): Promise<any[]> {
  const optionalSource = (id) => ({ optional: [{ sourceId: id }] });

  const constraintToSourceId = (constraint) => {
    const { deviceId } = constraint;

    if (typeof deviceId === 'string') {
      return deviceId;
    }

    if (Array.isArray(deviceId) && deviceId.length > 0) {
      return deviceId[0];
    }

    if (typeof deviceId === 'object' && deviceId.ideal) {
      return deviceId.ideal;
    }

    return null;
  };

  const sources: any[] = await new Promise((resolve) =>
    // @ts-ignore: https://caniuse.com/#search=getSources Chrome for Android (78) & Samsung Internet (10.1) use this
    MediaStreamTrack.getSources((sources) => resolve(sources))
  );

  let audioSource = null;
  let videoSource = null;

  sources.forEach((source) => {
    if (source.kind === 'audio') {
      audioSource = source.id;
    } else if (source.kind === 'video') {
      videoSource = source.id;
    }
  });

  const audioSourceId = constraintToSourceId(props.audioConstraints);
  if (audioSourceId) {
    audioSource = audioSourceId;
  }

  const videoSourceId = constraintToSourceId(props.videoConstraints);
  if (videoSourceId) {
    videoSource = videoSourceId;
  }

  return [optionalSource(audioSource), optionalSource(videoSource)];
}

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
  if (canGetUserMedia()) {
    return await sourceSelectedAsync(isMuted, props.audio, props.video);
  }
  const [audio, video] = await requestLegacyUserMediaAsync(props);
  return await sourceSelectedAsync(isMuted, audio, video);
}

export async function getAnyUserMediaAsync(
  constraints: MediaStreamConstraints,
  ignoreConstraints: boolean = false
): Promise<MediaStream> {
  try {
    return await getUserMediaAsync({
      ...constraints,
      video: ignoreConstraints || constraints.video,
    });
  } catch (error) {
    if (!ignoreConstraints && error.name === 'ConstraintNotSatisfiedError') {
      return await getAnyUserMediaAsync(constraints, true);
    }
    throw error;
  }
}

export async function getUserMediaAsync(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  const _getUserMedia =
    navigator['mozGetUserMedia'] || navigator['webkitGetUserMedia'] || navigator['msGetUserMedia'];
  return new Promise((resolve, reject) =>
    _getUserMedia.call(navigator, constraints, resolve, reject)
  );
}

export function canGetUserMedia(): boolean {
  return (
    // SSR
    Platform.isDOMAvailable &&
    // Has any form of media API
    !!(
      (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
      navigator['mozGetUserMedia'] ||
      navigator['webkitGetUserMedia'] ||
      navigator['msGetUserMedia']
    )
  );
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
