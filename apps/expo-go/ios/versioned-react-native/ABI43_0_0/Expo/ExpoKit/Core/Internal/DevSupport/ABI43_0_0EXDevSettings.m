// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI43_0_0EXDevSettings.h"
#import "ABI43_0_0EXDevSettingsDataSource.h"

// redefined from ABI43_0_0RCTDevMenu.mm
NSString *const kABI43_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI43_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI43_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation ABI43_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI43_0_0RCTDevSettings"; }

- (instancetype)initWithScopeKey:(NSString *)scopeKey isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI43_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI43_0_0RCTDevSettingHotLoadingEnabled: @YES,
                                  kABI43_0_0RCTDevSettingLiveReloadEnabled: @NO,
                                  };
  ABI43_0_0EXDevSettingsDataSource *dataSource = [[ABI43_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                         forScopeKey:scopeKey
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

- (NSArray<NSString *> *)supportedEvents
{
  return [super supportedEvents];
}

@end
