// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI38_0_0EXDevSettings.h"
#import "ABI38_0_0EXDevSettingsDataSource.h"

// redefined from ABI38_0_0RCTDevMenu.mm
NSString *const kABI38_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI38_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI38_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation ABI38_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI38_0_0RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI38_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI38_0_0RCTDevSettingHotLoadingEnabled: @YES,
                                  kABI38_0_0RCTDevSettingLiveReloadEnabled: @NO,
                                  };
  ABI38_0_0EXDevSettingsDataSource *dataSource = [[ABI38_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

- (NSArray<NSString *> *)supportedEvents
{
  return [super supportedEvents];
}

@end
