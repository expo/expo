import { mockPlatformAndroid, mockPlatformIOS, unmockAllProperties } from 'jest-expo';

import ExponentSegment from '../ExponentSegment';
import * as Segment from '../Segment';

describe('initialization', () => {
  const mockOptions = {
    androidWriteKey: 'android-write-key',
    iosWriteKey: 'ios-write-key',
  };

  afterEach(unmockAllProperties);

  it(`initializes on Android`, () => {
    mockPlatformAndroid();

    Segment.initialize(mockOptions);

    expect(ExponentSegment.initializeAndroid).toHaveBeenCalledWith(mockOptions.androidWriteKey);
    expect(ExponentSegment.initializeIOS).not.toHaveBeenCalled();
  });

  it(`initializes on iOS`, () => {
    mockPlatformIOS();

    Segment.initialize(mockOptions);

    expect(ExponentSegment.initializeIOS).toHaveBeenCalledWith(mockOptions.iosWriteKey);
    expect(ExponentSegment.initializeAndroid).not.toHaveBeenCalled();
  });
});
