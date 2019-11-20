import ExponentSegment from '../ExponentSegment';
import * as Segment from '../Segment';

const mockOptions = {
  androidWriteKey: 'android-write-key',
  iosWriteKey: 'ios-write-key',
};

it(`initializes`, () => {
  Segment.initialize(mockOptions);
  expect(ExponentSegment.initializeIOS).toHaveBeenCalledWith(mockOptions.iosWriteKey);
  expect(ExponentSegment.initializeAndroid).not.toHaveBeenCalled();
});
