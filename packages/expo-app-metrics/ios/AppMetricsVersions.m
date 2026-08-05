// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoAppMetrics/AppMetricsVersions.h>

#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)

#define REACT_NATIVE_VERSION_STRING STRINGIZE2(REACT_NATIVE_VERSION)
#define EXPO_SDK_VERSION_STRING STRINGIZE2(EXPO_SDK_VERSION)
#define EXPO_APP_METRICS_VERSION_STRING STRINGIZE2(EXPO_APP_METRICS_VERSION)
#define EXPO_EAS_BUILD_ID_STRING STRINGIZE2(EXPO_EAS_BUILD_ID)

@implementation AppMetricsVersions

+ (NSString *)reactNativeVersion
{
  return @REACT_NATIVE_VERSION_STRING;
}

+ (NSString *)expoSdkVersion
{
  return @EXPO_SDK_VERSION_STRING;
}

+ (NSString *)clientVersion
{
  return @EXPO_APP_METRICS_VERSION_STRING;
}

+ (NSString *)easBuildId
{
#ifdef EXPO_EAS_BUILD_ID
  return @EXPO_EAS_BUILD_ID_STRING;
#else
  return nil;
#endif
}

@end
