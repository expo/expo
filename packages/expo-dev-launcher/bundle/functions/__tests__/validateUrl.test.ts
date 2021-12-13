import { validateUrl } from '../validateUrl';

describe('validateUrl()', () => {
  test.only('identifies invalid urls', () => {
    const isValid = validateUrl('exp +devclient:/expo-development-client/?url=hello-joe');
    expect(isValid).toBe(false);
  });

  test.only('identifies valid urls', () => {
    const isValid = validateUrl('exp+devclient://expo-development-client/?url=hello-joe');
    expect(isValid).toBe(true);
  });

  test('validates url w/ query params', () => {
    const isValid = validateUrl(
      'https://u.expo.dev/675cb1f0-fa3c-11e8-ac99-6374d9643cb2?runtime-version=exposdk:43.0.0&platform=ios&channel_name=preview'
    );
    expect(isValid).toBe(true);
  });
});
