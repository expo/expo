// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI47_0_0Expo/ABI47_0_0EXAppDefinesLoader.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0ExpoModulesCore.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXAppDefines.h>
#import <ABI47_0_0React/ABI47_0_0RCTDefines.h>

@implementation ABI47_0_0EXAppDefinesLoader

+ (void)load
{
  BOOL APP_DEBUG;
  [ABI47_0_0EXAppDefines load:@{
#if DEBUG
    @"APP_DEBUG": @(YES),
#else
    @"APP_DEBUG": @(NO),
#endif
    @"APP_RCT_DEBUG": @(ABI47_0_0RCT_DEBUG),
    @"APP_RCT_DEV": @(ABI47_0_0RCT_DEV),
#if ABI47_0_0RCT_NEW_ARCH_ENABLED
    @"APP_NEW_ARCH_ENABLED": @(YES),
#else
    @"APP_NEW_ARCH_ENABLED": @(NO),
#endif
  }];
}

@end
