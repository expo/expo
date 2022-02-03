import {
  PermissionMap,
  PermissionType,
  PermissionStatus,
  PermissionInfo,
} from './Permissions.types';

/*
 * TODO: Bacon: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Permissions
 * Add messages to manifest like we do with iOS info.plist
 */

// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Using_the_new_API_in_older_browsers
// Older browsers might not implement mediaDevices at all, so we set an empty object first
function _getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  // Here, we will just add the getUserMedia property if it's missing.

  // First get ahold of the legacy getUserMedia, if present
  const getUserMedia =
    // TODO: this method is deprecated, migrate to https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    function () {
      const error: any = new Error('Permission unimplemented');
      error.code = 0;
      error.name = 'NotAllowedError';
      throw error;
    };

  return new Promise((resolve, reject) => {
    getUserMedia.call(navigator, constraints, resolve, reject);
  });
}

async function askForMediaPermissionAsync(
  options: MediaStreamConstraints
): Promise<PermissionInfo> {
  try {
    await _getUserMedia(options);
    return {
      status: PermissionStatus.GRANTED,
      expires: 'never',
      canAskAgain: true,
      granted: true,
    };
  } catch ({ message }) {
    // name: NotAllowedError
    // code: 0
    if (message === 'Permission dismissed') {
      // message: Permission dismissed
      return {
        status: PermissionStatus.UNDETERMINED,
        expires: 'never',
        canAskAgain: true,
        granted: false,
      };
    } else {
      // TODO: Bacon: [OSX] The system could deny access to chrome.
      // TODO: Bacon: add: { status: 'unimplemented' }
      // message: Permission denied
      return {
        status: PermissionStatus.DENIED,
        expires: 'never',
        canAskAgain: true,
        granted: false,
      };
    }
  }
}

async function askForMicrophonePermissionAsync(): Promise<PermissionInfo> {
  return await askForMediaPermissionAsync({ audio: true });
}

async function askForCameraPermissionAsync(): Promise<PermissionInfo> {
  return await askForMediaPermissionAsync({ video: true });
}

async function askForLocationPermissionAsync(): Promise<PermissionInfo> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () =>
        resolve({
          status: PermissionStatus.GRANTED,
          expires: 'never',
          canAskAgain: true,
          granted: true,
        }),
      ({ code }: GeolocationPositionError) => {
        // https://developer.mozilla.org/en-US/docs/Web/API/PositionError/code
        if (code === 1) {
          resolve({
            status: PermissionStatus.DENIED,
            expires: 'never',
            canAskAgain: true,
            granted: false,
          });
        } else {
          resolve({
            status: PermissionStatus.UNDETERMINED,
            expires: 'never',
            canAskAgain: true,
            granted: false,
          });
        }
      }
    );
  });
}

async function getPermissionWithQueryAsync(
  name: PermissionNameWithAdditionalValues
): Promise<PermissionStatus | null> {
  if (!navigator || !navigator.permissions || !navigator.permissions.query) return null;

  const { state } = await navigator.permissions.query({ name });
  if (state === 'prompt') {
    return PermissionStatus.UNDETERMINED;
  } else if (state === 'granted') {
    return PermissionStatus.GRANTED;
  } else if (state === 'denied') {
    return PermissionStatus.DENIED;
  }
  return null;
}

async function enumerateDevices(): Promise<MediaDeviceInfo[] | null> {
  if (navigator && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    return await navigator.mediaDevices.enumerateDevices();
  }

  // @ts-ignore: This is deprecated but we should still attempt to use it.
  if (window.MediaStreamTrack && typeof window.MediaStreamTrack.getSources === 'function') {
    // @ts-ignore
    return await MediaStreamTrack.getSources();
  }
  return null;
}

async function askSensorPermissionAsync(): Promise<PermissionStatus> {
  const requestPermission = getRequestMotionPermission();
  // Technically this is incorrect because it doesn't account for iOS 12.2 Safari.
  // But unfortunately we can only abstract so much.
  if (!requestPermission) return PermissionStatus.GRANTED;

  // If this isn't invoked in a touch-event then it never resolves.
  // Safari probably should throw an error but because it doesn't we have no way of informing the developer.
  const status = await requestPermission();
  switch (status) {
    case 'granted':
      return PermissionStatus.GRANTED;
    case 'denied':
      return PermissionStatus.DENIED;
    default:
      return PermissionStatus.UNDETERMINED;
  }
}

async function getMediaMaybeGrantedAsync(targetKind: MediaDeviceKind): Promise<boolean> {
  const devices = await enumerateDevices();
  if (!devices) {
    return false;
  }
  const result = await devices
    .filter(({ kind }) => kind === targetKind)
    .some(({ label }) => label !== '');
  // Granted or denied or undetermined or no devices
  return result;
}

async function getPermissionAsync(
  permission: PermissionType,
  shouldAsk: boolean
): Promise<PermissionInfo> {
  switch (permission) {
    case 'userFacingNotifications':
    case 'notifications':
      {
        if (!shouldAsk) {
          const status = await getPermissionWithQueryAsync('notifications');
          if (status) {
            return {
              status,
              expires: 'never',
              granted: status === PermissionStatus.GRANTED,
              canAskAgain: true,
            };
          }
        }

        const { Notification = {} } = window as any;
        if (Notification.requestPermission) {
          let status = Notification.permission;
          if (shouldAsk) {
            status = await Notification.requestPermission();
          }
          if (!status || status === 'default') {
            return {
              status: PermissionStatus.UNDETERMINED,
              expires: 'never',
              canAskAgain: true,
              granted: false,
            };
          }
          return {
            status,
            expires: 'never',
            canAskAgain: true,
            granted: status === PermissionStatus.GRANTED,
          };
        }
      }
      break;
    case 'motion': {
      if (shouldAsk) {
        const status = await askSensorPermissionAsync();
        return {
          status,
          expires: 'never',
          granted: status === PermissionStatus.GRANTED,
          canAskAgain: false,
        };
      }

      // We can infer from the requestor if this is an older browser.
      const status = getRequestMotionPermission()
        ? PermissionStatus.UNDETERMINED
        : isIOS()
        ? PermissionStatus.DENIED
        : PermissionStatus.GRANTED;
      return {
        status,
        expires: 'never',
        canAskAgain: true,
        granted: status === PermissionStatus.GRANTED,
      };
    }
    case 'location':
    case 'locationForeground':
    case 'locationBackground':
      {
        const maybeStatus = await getPermissionWithQueryAsync('geolocation');
        if (maybeStatus) {
          if (maybeStatus === PermissionStatus.UNDETERMINED && shouldAsk) {
            return await askForLocationPermissionAsync();
          }
          return {
            status: maybeStatus,
            expires: 'never',
            canAskAgain: true,
            granted: maybeStatus === PermissionStatus.GRANTED,
          };
        } else if (shouldAsk) {
          // TODO: Bacon: should this function as ask async when not in chrome?
          return await askForLocationPermissionAsync();
        }
      }
      break;
    case 'audioRecording':
      {
        const maybeStatus = await getPermissionWithQueryAsync('microphone');
        if (maybeStatus) {
          if (maybeStatus === PermissionStatus.UNDETERMINED && shouldAsk) {
            return await askForMicrophonePermissionAsync();
          }
          return {
            status: maybeStatus,
            expires: 'never',
            canAskAgain: true,
            granted: maybeStatus === PermissionStatus.GRANTED,
          };
        } else if (shouldAsk) {
          return await askForMicrophonePermissionAsync();
        } else {
          const maybeGranted = await getMediaMaybeGrantedAsync('audioinput');
          if (maybeGranted) {
            return {
              status: PermissionStatus.GRANTED,
              expires: 'never',
              canAskAgain: true,
              granted: true,
            };
          }
          // TODO: Bacon: Get denied or undetermined...
        }
      }
      break;
    case 'camera':
      {
        const maybeStatus = await getPermissionWithQueryAsync('camera');
        if (maybeStatus) {
          if (maybeStatus === PermissionStatus.UNDETERMINED && shouldAsk) {
            return await askForCameraPermissionAsync();
          }
          return {
            status: maybeStatus,
            expires: 'never',
            canAskAgain: true,
            granted: maybeStatus === PermissionStatus.GRANTED,
          };
        } else if (shouldAsk) {
          return await askForCameraPermissionAsync();
        } else {
          const maybeGranted = await getMediaMaybeGrantedAsync('videoinput');
          if (maybeGranted) {
            return {
              status: PermissionStatus.GRANTED,
              expires: 'never',
              canAskAgain: true,
              granted: true,
            };
          }
          // TODO: Bacon: Get denied or undetermined...
        }
      }
      break;
    default:
      break;
  }
  return {
    status: PermissionStatus.UNDETERMINED,
    expires: 'never',
    canAskAgain: true,
    granted: false,
  };
}

export default {
  get name(): string {
    return 'ExpoPermissions';
  },

  async getAsync(permissionTypes: PermissionType[]): Promise<PermissionMap> {
    const results = {};
    for (const permissionType of new Set(permissionTypes)) {
      results[permissionType] = await getPermissionAsync(permissionType, /* shouldAsk */ false);
    }
    return results;
  },

  async askAsync(permissionTypes: PermissionType[]): Promise<PermissionMap> {
    const results = {};
    for (const permissionType of new Set(permissionTypes)) {
      results[permissionType] = await getPermissionAsync(permissionType, /* shouldAsk */ true);
    }
    return results;
  },
};

/**
 * Temporary solution until `tslib.d.ts` is updated to include the new DeviceMotion API.
 * `typescript@4.4.4` is missing `requestPermission` described in https://w3c.github.io/deviceorientation/#devicemotion
 * MDN docs do not describe this property as well https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
 */
declare let DeviceMotionEvent: {
  prototype: DeviceMotionEvent;
  new (type: string, eventInitDict?: DeviceMotionEventInit): DeviceMotionEvent;
  requestPermission?: () => Promise<PermissionState>;
};

export function getRequestMotionPermission(): (() => Promise<PermissionState>) | null {
  if (typeof DeviceMotionEvent !== 'undefined' && !!DeviceMotionEvent?.requestPermission) {
    return DeviceMotionEvent.requestPermission;
  }

  return null;
}

// https://stackoverflow.com/a/9039885/4047926
function isIOS(): boolean {
  const isIOSUA = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
  const isIE11 = !!window['MSStream'];
  return isIOSUA && !isIE11;
}
