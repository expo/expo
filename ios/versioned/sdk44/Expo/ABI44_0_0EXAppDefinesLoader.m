// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI44_0_0Expo/ABI44_0_0EXAppDefinesLoader.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0ExpoModulesCore.h>
#import <ABI44_0_0React/ABI44_0_0RCTDefines.h>

@implementation ABI44_0_0EXAppDefinesLoader

+ (void)load
{
  BOOL APP_DEBUG;
  [ABI44_0_0EXAppDefines load:@{
#if DEBUG
    @"APP_DEBUG": @(YES),
#else
    @"APP_DEBUG": @(NO),
#endif
    @"APP_RCT_DEBUG": @(ABI44_0_0RCT_DEBUG),
    @"APP_RCT_DEV": @(ABI44_0_0RCT_DEV),
  }];
}

@end
