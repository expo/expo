import * as detox from 'detox';

const { device, init, expect, element, by } = detox;

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

export const getTextAsync = async testID => {
  try {
    await expect(element(by.id(testID))).toHaveText('_unfoundable_text');
    throw new Error('We never should get here unless target element has unfoundable text');
  } catch (error) {
    if (device.getPlatform() === 'ios') {
      const start = `accessibilityLabel was "`;
      const end = '" on ';
      const errorMessage = error.message.toString();
      const [, restMessage] = errorMessage.split(start);
      const [label] = restMessage.split(end);
      return label;
    } else {
      // Android to be tested
      const start = 'Got:';
      const end = '}"';
      const errorMessage = error.message.toString();
      const [, restMessage] = errorMessage.split(start);
      const [label] = restMessage.split(end);
      const value = label.split(',');
      var combineText = value.find(i => i.includes('text=')).trim();
      const [, elementText] = combineText.split('=');
      return elementText;
    }
  }
};
