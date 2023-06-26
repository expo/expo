// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI49_0_0EXDevSettings.h"
#import "ABI49_0_0EXDevSettingsDataSource.h"

// redefined from ABI49_0_0RCTDevMenu.mm
NSString *const kABI49_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI49_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI49_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation ABI49_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI49_0_0RCTDevSettings"; }

- (instancetype)initWithScopeKey:(NSString *)scopeKey isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI49_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI49_0_0RCTDevSettingHotLoadingEnabled: @YES,
                                  kABI49_0_0RCTDevSettingLiveReloadEnabled: @NO,
                                  };
  ABI49_0_0EXDevSettingsDataSource *dataSource = [[ABI49_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                         forScopeKey:scopeKey
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

- (NSArray<NSString *> *)supportedEvents
{
  return [super supportedEvents];
}

- (BOOL)isRemoteDebuggingAvailable
{
  NSString *bridgeDescription = [self.bridge valueForKey:@"_bridgeDescription"];
  BOOL isHermesRuntime = [bridgeDescription containsString:@"HermesRuntime"];
  if (isHermesRuntime) {
    // Disable remote debugging when running on Hermes
    return NO;
  }
  return [super isRemoteDebuggingAvailable];
}

@end
