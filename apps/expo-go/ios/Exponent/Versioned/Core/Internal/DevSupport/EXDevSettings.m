// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevSettings.h"
#import "EXDevSettingsDataSource.h"

// redefined from RCTDevMenu.mm
NSString *const kRCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kRCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kRCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation EXDevSettings

@synthesize bridge = _bridge;

+ (NSString *)moduleName { return @"RCTDevSettings"; }

- (instancetype)initWithScopeKey:(NSString *)scopeKey isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kRCTDevSettingShakeToShowDevMenu: @YES,
                                  kRCTDevSettingHotLoadingEnabled: @YES,
                                  kRCTDevSettingLiveReloadEnabled: @NO,
                                  };
  EXDevSettingsDataSource *dataSource = [[EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
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
