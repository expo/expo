import * as WarningAggregator from '../../utils/warnings';
import { getRequiresFullScreen, setRequiresFullScreen } from '../RequiresFullScreen';

it(`returns true if nothing provided`, () => {
  expect(getRequiresFullScreen({ ios: {} })).toBe(true);
});
it(`returns false if nothing provided after 43`, () => {
  expect(getRequiresFullScreen({ ios: {}, sdkVersion: '43.0.0' })).toBe(false);
  expect(getRequiresFullScreen({ ios: {}, sdkVersion: 'UNVERSIONED' })).toBe(false);
});
it(`asserts invalid SDK version`, () => {
  expect(() => getRequiresFullScreen({ ios: {}, sdkVersion: '43.0' })).toThrow(/version/);
});

it(`returns the given value if provided`, () => {
  expect(getRequiresFullScreen({ ios: { requireFullScreen: false } })).toBe(false);
  expect(getRequiresFullScreen({ ios: { requireFullScreen: true } })).toBe(true);
});

it(`sets UIRequiresFullScreen value`, () => {
  expect(setRequiresFullScreen({ ios: { requireFullScreen: false } }, {})).toMatchObject({
    UIRequiresFullScreen: false,
  });

  expect(setRequiresFullScreen({}, {})).toMatchObject({
    UIRequiresFullScreen: true,
  });
});

beforeEach(() => {
  // @ts-ignore: jest
  // eslint-disable-next-line import/namespace
  WarningAggregator.addWarningIOS = jest.fn();
});

it(`updates the UISupportedInterfaceOrientations~ipad values to support iPad multi-tasking`, () => {
  expect(setRequiresFullScreen({ ios: { requireFullScreen: false } }, {})).toMatchObject({
    UIRequiresFullScreen: false,
    'UISupportedInterfaceOrientations~ipad': [
      'UIInterfaceOrientationPortrait',
      'UIInterfaceOrientationPortraitUpsideDown',
      'UIInterfaceOrientationLandscapeLeft',
      'UIInterfaceOrientationLandscapeRight',
    ],
  });

  expect(WarningAggregator.addWarningIOS).not.toBeCalled();
});

it(`warns when the predefined UISupportedInterfaceOrientations~ipad values are invalid`, () => {
  setRequiresFullScreen(
    { ios: { requireFullScreen: false } },
    {
      'UISupportedInterfaceOrientations~ipad': [
        'UIInterfaceOrientationPortrait',
        'UIInterfaceOrientationPortraitUpsideDown',
        'UIInterfaceOrientationLandscapeRight',
      ],
    }
  );

  expect(WarningAggregator.addWarningIOS).toBeCalledTimes(1);
});

it(`does not warn when predefined orientation mask matches required values`, () => {
  setRequiresFullScreen(
    { ios: { requireFullScreen: false } },
    {
      'UISupportedInterfaceOrientations~ipad': [
        'UIInterfaceOrientationPortrait',
        'UIInterfaceOrientationPortraitUpsideDown',
        'UIInterfaceOrientationLandscapeLeft',
        'UIInterfaceOrientationLandscapeRight',
      ],
    }
  );

  expect(WarningAggregator.addWarningIOS).not.toBeCalled();
});

it(`does not warn when predefined orientation mask is empty`, () => {
  setRequiresFullScreen(
    { ios: { requireFullScreen: false } },
    {
      'UISupportedInterfaceOrientations~ipad': [],
    }
  );

  expect(WarningAggregator.addWarningIOS).not.toBeCalled();
});

it(`cannot remove predefined orientation mask`, () => {
  let plist = {};
  plist = setRequiresFullScreen({ ios: { requireFullScreen: false } }, plist);
  expect(plist['UISupportedInterfaceOrientations~ipad']?.length).toBe(4);
  plist = setRequiresFullScreen({ ios: { requireFullScreen: true } }, plist);
  expect(plist['UISupportedInterfaceOrientations~ipad']?.length).toBe(4);
  expect(WarningAggregator.addWarningIOS).not.toBeCalled();
});
