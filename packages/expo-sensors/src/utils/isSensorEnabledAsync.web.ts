type SensorEventName = 'deviceorientation' | 'devicemotion';

// iOS 12.2 disables DeviceMotion by default now
// https://github.com/w3c/deviceorientation/issues/57
export async function guardSensorEventEnabledAsync(
  eventName: SensorEventName,
  timeout?: number
): Promise<boolean> {
  if (!isIOS()) {
    return true;
  }

  try {
    return await guardEventEnabledAsync(eventName, timeout);
  } catch ({ message }) {
    throw new Error(
      message +
        '\nEnable device orientation in Settings > Safari > Motion & Orientation Access' +
        '\nalso ensure that you are hosting with https as DeviceMotion is now a secure API on iOS Safari.'
    );
  }
}

// throw error if the sensor is disabled.
export async function guardEventEnabledAsync(
  eventName: string,
  timeout: number = 500
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      window.removeEventListener(eventName, listener);
      reject(new Error(`Cannot observe event: ${eventName}.`));
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
  const iosUA = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
  const isIE11 = !!window['MSStream'];
  return iosUA && !isIE11;
}

export async function isSensorEnabledAsync(
  eventName: SensorEventName,
  timeout?: number
): Promise<boolean> {
  try {
    await guardEventEnabledAsync(eventName, timeout);
    return true;
  } catch (error) {
    return false;
  }
}

export default isSensorEnabledAsync;
