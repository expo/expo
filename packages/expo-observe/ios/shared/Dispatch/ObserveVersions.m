// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoObserve/ObserveVersions.h>

#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)

#define EXPO_OBSERVE_VERSION_STRING STRINGIZE2(EXPO_OBSERVE_VERSION)

@implementation ObserveVersions

+ (NSString *)clientVersion
{
  return @EXPO_OBSERVE_VERSION_STRING;
}

@end
