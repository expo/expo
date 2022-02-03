// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI44_0_0EXDevSettings.h"
#import "ABI44_0_0EXDevSettingsDataSource.h"

// redefined from ABI44_0_0RCTDevMenu.mm
NSString *const kABI44_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI44_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI44_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation ABI44_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI44_0_0RCTDevSettings"; }

- (instancetype)initWithScopeKey:(NSString *)scopeKey isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI44_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI44_0_0RCTDevSettingHotLoadingEnabled: @YES,
                                  kABI44_0_0RCTDevSettingLiveReloadEnabled: @NO,
                                  };
  ABI44_0_0EXDevSettingsDataSource *dataSource = [[ABI44_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                         forScopeKey:scopeKey
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

- (NSArray<NSString *> *)supportedEvents
{
  return [super supportedEvents];
}

@end
