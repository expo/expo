import ExponentSegment from '../ExponentSegment';
import * as Segment from '../Segment';

const mockOptions = {
  androidWriteKey: 'android-write-key',
  iosWriteKey: 'ios-write-key',
};

it(`initializes`, () => {
  console.log(Object.keys(ExponentSegment));
  Segment.initialize(mockOptions);

  expect(ExponentSegment.initialize).toHaveBeenCalledWith(mockOptions.androidWriteKey);
  expect(ExponentSegment.initialize).not.toHaveBeenCalled();
});

it(`does not initialize`, () => {
  Segment.initialize({ iosWriteKey: 'ios-write-key' });

  expect(ExponentSegment.initialize).not.toHaveBeenCalled();
});
