// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI40_0_0EXDevSettings.h"
#import "ABI40_0_0EXDevSettingsDataSource.h"

// redefined from ABI40_0_0RCTDevMenu.mm
NSString *const kABI40_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI40_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI40_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation ABI40_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI40_0_0RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI40_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI40_0_0RCTDevSettingHotLoadingEnabled: @YES,
                                  kABI40_0_0RCTDevSettingLiveReloadEnabled: @NO,
                                  };
  ABI40_0_0EXDevSettingsDataSource *dataSource = [[ABI40_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

- (NSArray<NSString *> *)supportedEvents
{
  return [super supportedEvents];
}

@end
