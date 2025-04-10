import * as WarningAggregator from '../../utils/warnings';
import { setRequiresFullScreen } from '../RequiresFullScreen';

it(`sets UIRequiresFullScreen value`, () => {
  expect(setRequiresFullScreen({ ios: { requireFullScreen: true } }, {})).toMatchObject({
    UIRequiresFullScreen: true,
  });

  expect(setRequiresFullScreen({}, {})).toMatchObject({
    UIRequiresFullScreen: false,
  });
});

beforeEach(() => {
  // @ts-ignore: jest
  // eslint-disable-next-line import/namespace
  WarningAggregator.addWarningIOS = jest.fn();
});

it(`sets requires full screen`, () => {
  expect(setRequiresFullScreen({ ios: { requireFullScreen: true } }, {})).toMatchObject({
    UIRequiresFullScreen: true,
  });

  expect(WarningAggregator.addWarningIOS).not.toBeCalled();
});

it(`updates the UISupportedInterfaceOrientations~ipad values to support iPad multi-tasking`, () => {
  expect(
    setRequiresFullScreen({ ios: { requireFullScreen: false, supportsTablet: true } }, {})
  ).toMatchObject({
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

it(`does not set the UISupportedInterfaceOrientations~ipad values to support iPad multi-tasking if supportsTablet is false`, () => {
  expect(
    setRequiresFullScreen({ ios: { requireFullScreen: false, supportsTablet: false } }, {})
  ).toMatchObject({
    UIRequiresFullScreen: false,
  });

  expect(WarningAggregator.addWarningIOS).not.toBeCalled();
});

xit(`warns when the predefined UISupportedInterfaceOrientations~ipad values are invalid`, () => {
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
  plist = setRequiresFullScreen({ ios: { requireFullScreen: false, supportsTablet: true } }, plist);
  expect(plist['UISupportedInterfaceOrientations~ipad']?.length).toBe(4);
  plist = setRequiresFullScreen({ ios: { requireFullScreen: true, isTabletOnly: true } }, plist);
  expect(plist['UISupportedInterfaceOrientations~ipad']?.length).toBe(4);
  expect(WarningAggregator.addWarningIOS).not.toBeCalled();
});
