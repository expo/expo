import ExponentSegment from '../ExponentSegment';
import * as Segment from '../Segment';

const mockOptions = {
  androidWriteKey: 'android-write-key',
  iosWriteKey: 'ios-write-key',
};

it(`initializes once for ios`, () => {
  Segment.initialize(mockOptions);
  expect(ExponentSegment.initialize).toHaveBeenCalledWith(mockOptions.iosWriteKey);
  expect(ExponentSegment.initialize).toHaveBeenCalledTimes(1);
});

it(`calling with an empty object results in error`, () => {
  expect(() => {
    Segment.initialize({});
  }).toThrowError(
    new Error('You must provide a platform-specific write key to initialize Segment.')
  );

  expect(ExponentSegment.initialize).toHaveBeenCalledTimes(0);
});
