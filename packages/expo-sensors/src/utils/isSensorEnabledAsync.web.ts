import { PermissionResponse, PermissionStatus, Platform } from 'expo-modules-core';

type SensorEventName = 'deviceorientation' | 'devicemotion';

export async function getPermissionsAsync(): Promise<PermissionResponse> {
  // We can infer from the requestor if this is an older browser.
  const status = getRequestPermission()
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

export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  const status = await askSensorPermissionAsync();
  return {
    status,
    expires: 'never',
    granted: status === PermissionStatus.GRANTED,
    canAskAgain: false,
  };
}

async function askSensorPermissionAsync(): Promise<PermissionStatus> {
  const requestPermission = getRequestPermission();
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

/**
 * Temporary solution until `tslib.d.ts` is updated to include the new DeviceOrientation/DeviceMotion API (as of 2021.10.26 it's not implemented completely, it's in experimental state).
 *
 * `typescript@4.4.4` is missing `requestPermission` described in
 * - https://w3c.github.io/deviceorientation/#deviceorientation
 * - https://w3c.github.io/deviceorientation/#devicemotion
 *
 * MDN docs does not describe this property as well:
 * - https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
 * - https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
 *
 * Below are just redefinitions of the existing typing available in the:
 * - https://github.com/microsoft/TypeScript/blob/01de6ff2ecdc6175727f7f999b887519d40ca115/lib/lib.dom.d.ts#L4216
 * - https://github.com/microsoft/TypeScript/blob/01de6ff2ecdc6175727f7f999b887519d40ca115/lib/lib.dom.d.ts#L4241.
 */
declare let DeviceMotionEvent: {
  prototype: DeviceMotionEvent;
  new (type: string, eventInitDict?: DeviceMotionEventInit): DeviceMotionEvent;
  requestPermission?: () => Promise<PermissionState>;
};
/**
 * See `DeviceMotionEvent` description a few lines above.
 */
declare let DeviceOrientationEvent: {
  prototype: DeviceOrientationEvent;
  new (type: string, eventInitDict?: DeviceOrientationEventInit): DeviceOrientationEvent;
  requestPermission?: () => Promise<PermissionState>;
};

export function getRequestPermission(): (() => Promise<PermissionState>) | null {
  if (!Platform.isDOMAvailable) {
    return null;
  }

  if (typeof DeviceMotionEvent !== 'undefined' && !!DeviceMotionEvent?.requestPermission) {
    return DeviceMotionEvent.requestPermission;
  } else if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    !!DeviceOrientationEvent?.requestPermission
  ) {
    return DeviceOrientationEvent.requestPermission;
  }

  return null;
}

class PermissionError extends Error {
  constructor(eventName: string) {
    let errorMessage = `Cannot observe event: ${eventName}. How to fix:`;

    errorMessage += `\n- Ensure you've requested the \`MOTION\` permission via expo-permissions (this must be done in a touch event).`;

    if (location.protocol !== 'https:') {
      errorMessage +=
        '\n- Ensure that you are hosting with `https` as DeviceMotion and DeviceOrientation are now secure APIs.';
    }
    // is iOS and doesn't support requesting permissions, must be 12.2
    if (isIOS() && !getRequestPermission()) {
      errorMessage +=
        '\n- On iOS 12.2, you must manually enable device orientation in `Settings > Safari > Motion & Orientation Access`.';
    }

    super(errorMessage);
  }
}

// iOS 12.2 disables DeviceMotion by default now
// https://github.com/w3c/deviceorientation/issues/57
export async function assertSensorEventEnabledAsync(
  eventName: SensorEventName,
  timeout?: number
): Promise<boolean> {
  if (!Platform.isDOMAvailable) {
    return false;
  }

  if (getRequestPermission()) {
    if (await isSensorEnabledAsync(eventName, timeout)) {
      return true;
    }
    throw new PermissionError(eventName);
  }
  return true;
}

// throw error if the sensor is disabled.
export async function isSensorEnabledAsync(
  eventName: SensorEventName,
  // Initial interval tests found results on a median of
  // devicemotion:
  // - iPhone 7 Plus: 166.6666753590107ms
  // - iPhone X: 166.6666753590107ms
  // deviceorientation:
  // -
  //
  // The initial launch of iOS Safari onto a page calling this API seems to take a little longer than a regular call.
  // devicemotion:
  // - ~35ms
  // deviceorientation:
  // - ~45ms
  //
  timeout: number = 250
): Promise<boolean> {
  if (!Platform.isDOMAvailable) {
    return false;
  }

  // If there is no method to request permission then the device has access to device motion.
  // Older versions of iOS have no method but still disable motion so we should always check on iOS.
  if (!isIOS && !getRequestPermission()) {
    return true;
  }

  return new Promise((resolve) => {
    const id = setTimeout(() => {
      window.removeEventListener(eventName, listener);
      resolve(false);
    }, timeout);

    const listener = (): void => {
      clearTimeout(id);
      window.removeEventListener(eventName, listener);
      resolve(true);
    };

    window.addEventListener(eventName, listener);
  });
}

// https://stackoverflow.com/a/9039885/4047926
function isIOS(): boolean {
  const isIOSUA = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
  const isIE11 = !!window['MSStream'];
  return isIOSUA && !isIE11;
}
