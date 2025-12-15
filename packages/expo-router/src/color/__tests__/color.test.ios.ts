import { PlatformColor } from 'react-native';

import { Color } from '..';
import { Material3Color, Material3DynamicColor } from '../materialColor';

it('retrieves android base color as platform color', () => {
  const color = Color.android.background_dark;
  expect(typeof color).toBe('object');
  expect(color).toStrictEqual(PlatformColor('@android:color/background_dark'));
});

it('retrieves android attr color as platform color', () => {
  const color = Color.android.attr.colorAccent;
  expect(typeof color).toBe('object');
  expect(color).toStrictEqual(PlatformColor('?attr/colorAccent'));
});

it.each([
  { color: Color.ios.systemBlue, platformColorString: 'systemBlue' },
  { color: Color.ios.systemRed, platformColorString: 'systemRed' },
  { color: Color.ios.systemGreen, platformColorString: 'systemGreen' },
  { color: Color.ios.systemBackground, platformColorString: 'systemBackground' },
  { color: Color.ios.label, platformColorString: 'label' },
])(
  'retrieves ios base color as platform color for $platformColorString',
  ({ color, platformColorString }) => {
    expect(typeof color).toBe('object');
    expect(color).toStrictEqual(PlatformColor(platformColorString));
  }
);

it.each([
  { color: () => Color.android.material.primary },
  { color: () => Color.android.material.error },
  { color: () => Color.android.material.onBackground },
  {
    color: () => Color.android.material.surfaceContainerHighest,
  },
])('returns null for android material color', ({ color }) => {
  const result = color();
  expect(result).toBeNull();
});

it.each([
  { color: () => Color.android.material.primary },
  { color: () => Color.android.material.error },
  { color: () => Color.android.material.onBackground },
  {
    color: () => Color.android.material.surfaceContainerHighest,
  },
])('returns null for android material dynamic color', ({ color }) => {
  const result = color();
  expect(result).toBeNull();
});
