// Copyright 2016-present 650 Industries. All rights reserved.

#import <Expo/EXAppDefinesLoader.h>

#import <ExpoModulesCore/ExpoModulesCore.h>
#import <ExpoModulesCore/EXAppDefines.h>
#import <React/RCTDefines.h>

@implementation EXAppDefinesLoader

+ (void)load
{
  BOOL APP_DEBUG;
  [EXAppDefines load:@{
#if DEBUG
    @"APP_DEBUG": @(YES),
#else
    @"APP_DEBUG": @(NO),
#endif
    @"APP_RCT_DEBUG": @(RCT_DEBUG),
    @"APP_RCT_DEV": @(RCT_DEV),
#if RCT_NEW_ARCH_ENABLED
    @"APP_NEW_ARCH_ENABLED": @(YES),
#else
    @"APP_NEW_ARCH_ENABLED": @(NO),
#endif
  }];
}

@end
