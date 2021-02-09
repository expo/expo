import * as detox from 'detox';

const { device, init } = detox;

export const sleepAsync = t => new Promise(res => setTimeout(res, t));

export async function launchWithPermissionsAsync(config, permissions, options) {
  if (Object.keys(permissions).length) {
    await init(config, { launchApp: false, ...options });
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
    });
  } else {
    await init(config, options);
  }
}
