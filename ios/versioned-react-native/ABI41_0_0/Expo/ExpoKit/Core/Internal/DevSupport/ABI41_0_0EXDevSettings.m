// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI41_0_0EXDevSettings.h"
#import "ABI41_0_0EXDevSettingsDataSource.h"

// redefined from ABI41_0_0RCTDevMenu.mm
NSString *const kABI41_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI41_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI41_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation ABI41_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI41_0_0RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI41_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI41_0_0RCTDevSettingHotLoadingEnabled: @YES,
                                  kABI41_0_0RCTDevSettingLiveReloadEnabled: @NO,
                                  };
  ABI41_0_0EXDevSettingsDataSource *dataSource = [[ABI41_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

- (NSArray<NSString *> *)supportedEvents
{
  return [super supportedEvents];
}

@end
