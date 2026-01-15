import { PlatformColor } from 'react-native';

import { Color } from '..';
import { Material3Color, Material3DynamicColor } from '../materialColor';

let warnMock: jest.SpyInstance;

beforeEach(() => {
  warnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnMock.mockRestore();
});

it.each([
  { color: Color.android.background_dark, platformColorString: '@android:color/background_dark' },
  {
    color: Color.android.background_light,
    platformColorString: '@android:color/background_light',
  },
  { color: Color.android.darker_gray, platformColorString: '@android:color/darker_gray' },
  {
    color: Color.android.holo_blue_bright,
    platformColorString: '@android:color/holo_blue_bright',
  },
  { color: Color.android.holo_green_dark, platformColorString: '@android:color/holo_green_dark' },
  {
    color: Color.android.notification_icon_bg_color,
    platformColorString: '@android:color/notification_icon_bg_color',
  },
  {
    color: Color.android.customColorThatDoesNotExist,
    platformColorString: '@android:color/customColorThatDoesNotExist',
  },
])(
  'retrieves base android color as platform color for $platformColorString',
  ({ color, platformColorString }) => {
    expect(typeof color).toBe('object');
    expect(color).toStrictEqual(PlatformColor(platformColorString));
    expect(warnMock).not.toHaveBeenCalled();
  }
);

it.each([
  { color: Color.android.attr.colorAccent, platformColorString: '?attr/colorAccent' },
  { color: Color.android.attr.colorBackground, platformColorString: '?attr/colorBackground' },
  { color: Color.android.attr.colorError, platformColorString: '?attr/colorError' },
  { color: Color.android.attr.colorPrimary, platformColorString: '?attr/colorPrimary' },
  { color: Color.android.attr.colorPrimaryDark, platformColorString: '?attr/colorPrimaryDark' },
  {
    color: Color.android.attr.customColorThatDoesNotExist,
    platformColorString: '?attr/customColorThatDoesNotExist',
  },
])(
  'retrieves base android color as platform color for $platformColorString',
  ({ color, platformColorString }) => {
    expect(typeof color).toBe('object');
    expect(color).toStrictEqual(PlatformColor(platformColorString));
    expect(warnMock).not.toHaveBeenCalled();
  }
);

it('returns null for ios base color', () => {
  const color = Color.ios.systemBlue;
  expect(typeof color).toBe('object');
  expect(color).toStrictEqual(null);
  expect(warnMock).toHaveBeenCalledTimes(1);
  expect(warnMock).toHaveBeenCalledWith(
    `Color.ios.systemBlue is not available on android. Consider using a different color for this platform.`
  );
});

jest.mock('../materialColor', () => {
  const originalModule = jest.requireActual(
    '../materialColor'
  ) as typeof import('../materialColor');

  return {
    ...originalModule,
    Material3Color: jest.fn((name: string) => 'Material3Color:' + name),
    Material3DynamicColor: jest.fn((name: string) => 'Material3DynamicColor:' + name),
  };
});

it.each([
  { color: () => Color.android.material.primary, expected: 'primary' },
  { color: () => Color.android.material.error, expected: 'error' },
  { color: () => Color.android.material.onBackground, expected: 'onBackground' },
  {
    color: () => Color.android.material.surfaceContainerHighest,
    expected: 'surfaceContainerHighest',
  },
])(
  'when Color.android.material.$expected is called, then calls Material3Color($expected)',
  ({ color, expected }) => {
    const result = color();
    expect(Material3Color).toHaveBeenCalledWith(expected);
    expect(result).toBe('Material3Color:' + expected);
    expect(warnMock).not.toHaveBeenCalled();
  }
);

it.each([
  { color: () => Color.android.dynamic.primary, expected: 'primary' },
  { color: () => Color.android.dynamic.error, expected: 'error' },
  { color: () => Color.android.dynamic.onBackground, expected: 'onBackground' },
  {
    color: () => Color.android.dynamic.surfaceContainerHighest,
    expected: 'surfaceContainerHighest',
  },
])(
  'when Color.android.dynamic.$expected is called, then calls Material3DynamicColor($expected)',
  ({ color, expected }) => {
    const result = color();
    expect(Material3DynamicColor).toHaveBeenCalledWith(expected);
    expect(result).toBe('Material3DynamicColor:' + expected);
    expect(warnMock).not.toHaveBeenCalled();
  }
);
