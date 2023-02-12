// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI46_0_0EXDevSettings.h"
#import "ABI46_0_0EXDevSettingsDataSource.h"

// redefined from ABI46_0_0RCTDevMenu.mm
NSString *const kABI46_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI46_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI46_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation ABI46_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI46_0_0RCTDevSettings"; }

- (instancetype)initWithScopeKey:(NSString *)scopeKey isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI46_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI46_0_0RCTDevSettingHotLoadingEnabled: @YES,
                                  kABI46_0_0RCTDevSettingLiveReloadEnabled: @NO,
                                  };
  ABI46_0_0EXDevSettingsDataSource *dataSource = [[ABI46_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                         forScopeKey:scopeKey
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

- (NSArray<NSString *> *)supportedEvents
{
  return [super supportedEvents];
}

@end
