import { mockPlatformAndroid, mockPlatformIOS, unmockAllProperties } from 'jest-expo';

import ExponentSegment from '../ExponentSegment';
import * as Segment from '../Segment';

const ANDROID_WRITE_KEY = 'android-write-key';
const IOS_WRITE_KEY = 'ios-write-key';

describe('Segment initialization', () => {
  it('initializes iOS', () => {
    mockPlatformIOS();
    Segment.initialize({
      androidWriteKey: ANDROID_WRITE_KEY,
      iosWriteKey: IOS_WRITE_KEY,
    });
    expect(ExponentSegment.initializeIOS).toHaveBeenCalled();
    unmockAllProperties();
  });
  it('initializes Android', () => {
    mockPlatformAndroid();
    Segment.initialize({
      androidWriteKey: ANDROID_WRITE_KEY,
      iosWriteKey: IOS_WRITE_KEY,
    });
    expect(ExponentSegment.initializeAndroid).toHaveBeenCalled();
    unmockAllProperties();
  });
});
