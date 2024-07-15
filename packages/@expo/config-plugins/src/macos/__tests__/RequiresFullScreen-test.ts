import * as WarningAggregator from '../../utils/warnings';
import { getRequiresFullScreen, setRequiresFullScreen } from '../RequiresFullScreen';

it(`returns true if nothing provided`, () => {
  expect(getRequiresFullScreen({ macos: {} })).toBe(true);
});
it(`returns false if nothing provided after 43`, () => {
  expect(getRequiresFullScreen({ macos: {}, sdkVersion: '43.0.0' })).toBe(false);
  expect(getRequiresFullScreen({ macos: {}, sdkVersion: 'UNVERSIONED' })).toBe(false);
});
it(`asserts invalid SDK version`, () => {
  expect(() => getRequiresFullScreen({ macos: {}, sdkVersion: '43.0' })).toThrow(/version/);
});

it(`returns the given value if provided`, () => {
  expect(getRequiresFullScreen({ macos: { requireFullScreen: false } })).toBe(false);
  expect(getRequiresFullScreen({ macos: { requireFullScreen: true } })).toBe(true);
});

it(`sets UIRequiresFullScreen value`, () => {
  expect(setRequiresFullScreen({ macos: { requireFullScreen: false } }, {})).toMatchObject({
    UIRequiresFullScreen: false,
  });

  expect(setRequiresFullScreen({}, {})).toMatchObject({
    UIRequiresFullScreen: true,
  });
});

beforeEach(() => {
  // @ts-ignore: jest
  // eslint-disable-next-line import/namespace
  WarningAggregator.addWarningMacOS = jest.fn();
});

it(`updates the UISupportedInterfaceOrientations~ipad values to support iPad multi-tasking`, () => {
  expect(setRequiresFullScreen({ macos: { requireFullScreen: false } }, {})).toMatchObject({
    UIRequiresFullScreen: false,
    'UISupportedInterfaceOrientations~ipad': [
      'UIInterfaceOrientationPortrait',
      'UIInterfaceOrientationPortraitUpsideDown',
      'UIInterfaceOrientationLandscapeLeft',
      'UIInterfaceOrientationLandscapeRight',
    ],
  });

  expect(WarningAggregator.addWarningMacOS).not.toBeCalled();
});

it(`warns when the predefined UISupportedInterfaceOrientations~ipad values are invalid`, () => {
  setRequiresFullScreen(
    { macos: { requireFullScreen: false } },
    {
      'UISupportedInterfaceOrientations~ipad': [
        'UIInterfaceOrientationPortrait',
        'UIInterfaceOrientationPortraitUpsideDown',
        'UIInterfaceOrientationLandscapeRight',
      ],
    }
  );

  expect(WarningAggregator.addWarningMacOS).toBeCalledTimes(1);
});

it(`does not warn when predefined orientation mask matches required values`, () => {
  setRequiresFullScreen(
    { macos: { requireFullScreen: false } },
    {
      'UISupportedInterfaceOrientations~ipad': [
        'UIInterfaceOrientationPortrait',
        'UIInterfaceOrientationPortraitUpsideDown',
        'UIInterfaceOrientationLandscapeLeft',
        'UIInterfaceOrientationLandscapeRight',
      ],
    }
  );

  expect(WarningAggregator.addWarningMacOS).not.toBeCalled();
});

it(`does not warn when predefined orientation mask is empty`, () => {
  setRequiresFullScreen(
    { macos: { requireFullScreen: false } },
    {
      'UISupportedInterfaceOrientations~ipad': [],
    }
  );

  expect(WarningAggregator.addWarningMacOS).not.toBeCalled();
});

it(`cannot remove predefined orientation mask`, () => {
  let plist = {};
  plist = setRequiresFullScreen({ macos: { requireFullScreen: false } }, plist);
  expect(plist['UISupportedInterfaceOrientations~ipad']?.length).toBe(4);
  plist = setRequiresFullScreen({ macos: { requireFullScreen: true } }, plist);
  expect(plist['UISupportedInterfaceOrientations~ipad']?.length).toBe(4);
  expect(WarningAggregator.addWarningMacOS).not.toBeCalled();
});
