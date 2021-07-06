// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI42_0_0EXDevSettings.h"
#import "ABI42_0_0EXDevSettingsDataSource.h"

// redefined from ABI42_0_0RCTDevMenu.mm
NSString *const kABI42_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI42_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI42_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation ABI42_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI42_0_0RCTDevSettings"; }

- (instancetype)initWithScopeKey:(NSString *)scopeKey isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI42_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI42_0_0RCTDevSettingHotLoadingEnabled: @YES,
                                  kABI42_0_0RCTDevSettingLiveReloadEnabled: @NO,
                                  };
  ABI42_0_0EXDevSettingsDataSource *dataSource = [[ABI42_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                                                     forScopeKey:scopeKey
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

- (NSArray<NSString *> *)supportedEvents
{
  return [super supportedEvents];
}

@end
