// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppDefines.h>
#import <React/RCTDefines.h>

// Assuming ExpoModulesCore is not shipping as prebuilt xcframework,
// so that `DEBUG` and other definitions are same as app building definitions.
// Other prebuilt module can leverage these `APP_*` to get the app building definitions.

@implementation EXAppDefines

+ (BOOL)APP_DEBUG
{
#if DEBUG
  return YES;
#else
  return NO;
#endif
}

+ (BOOL)APP_RCT_DEBUG
{
  return RCT_DEBUG;
}

+ (BOOL)APP_RCT_DEV
{
  return RCT_DEV;
}

@end
