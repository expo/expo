import { device } from 'detox';

export const sleepAsync = (t) => new Promise((res) => setTimeout(res, t));

export async function launchWithPermissionsAsync(permissions) {
  if (Object.keys(permissions).length) {
    await device.launchApp({
      permissions: Object.keys(permissions).reduce((prev, curr) => {
        const value = permissions[curr];
        if (typeof value === 'string') {
          return {
            ...prev,
            [curr]: value,
          };
        } else {
          return {
            ...prev,
            [curr]: value ? 'YES' : 'NO',
          };
        }
      }, {}),
      newInstance: true,
      launchArgs: {
        EXDevMenuIsOnboardingFinished: true,
      },
    });
  }
}
