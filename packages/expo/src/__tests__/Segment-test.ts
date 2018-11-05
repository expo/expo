import { Segment } from 'expo-analytics-segment';
import { NativeModulesProxy } from 'expo-react-native-adapter';
import { mockPlatformAndroid, mockPlatformIOS, unmockAllProperties } from '../../test/mocking';

describe('initialization', () => {
  const mockOptions = {
    androidWriteKey: 'android-write-key',
    iosWriteKey: 'ios-write-key',
  };

  afterEach(unmockAllProperties);

  it(`initializes on Android`, () => {
    mockPlatformAndroid();

    Segment.initialize(mockOptions);

    expect(NativeModulesProxy.ExponentSegment.initializeAndroid).toHaveBeenCalledWith(
      mockOptions.androidWriteKey
    );
    expect(NativeModulesProxy.ExponentSegment.initializeIOS).not.toHaveBeenCalled();
  });

  it(`initializes on iOS`, () => {
    mockPlatformIOS();

    Segment.initialize(mockOptions);

    expect(NativeModulesProxy.ExponentSegment.initializeIOS).toHaveBeenCalledWith(
      mockOptions.iosWriteKey
    );
    expect(NativeModulesProxy.ExponentSegment.initializeAndroid).not.toHaveBeenCalled();
  });
});
