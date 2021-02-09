import ExponentSegment from '../ExponentSegment';
import * as Segment from '../Segment';

const mockOptions = {
  androidWriteKey: 'android-write-key',
  iosWriteKey: 'ios-write-key',
};

it(`initializes once for android`, () => {
  Segment.initialize(mockOptions);
  expect(ExponentSegment.initialize).toHaveBeenCalledWith(mockOptions.androidWriteKey);
  expect(ExponentSegment.initialize).toHaveBeenCalledTimes(1);
});
