import ExponentSegment from '../ExponentSegment';
import * as Segment from '../Segment';

const mockOptions = {
  androidWriteKey: 'android-write-key',
  iosWriteKey: 'ios-write-key',
};

it(`initializes`, () => {
  Segment.initialize(mockOptions);
  expect(ExponentSegment.initialize).toHaveBeenCalledWith(mockOptions.iosWriteKey);
  expect(ExponentSegment.initialize).not.toHaveBeenCalled();
});

it(`does not initialize`, () => {
  Segment.initialize({ androidWriteKey: 'android-write-key' });

  expect(ExponentSegment.initialize).not.toHaveBeenCalled();
});
