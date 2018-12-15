// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI32_0_0EXDevSettings.h"
#import "ABI32_0_0EXDevSettingsDataSource.h"

// redefined from ABI32_0_0RCTDevMenu.mm
NSString *const kABI32_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI32_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";

@implementation ABI32_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI32_0_0RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI32_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI32_0_0RCTDevSettingLiveReloadEnabled: @YES,
                                  };
  ABI32_0_0EXDevSettingsDataSource *dataSource = [[ABI32_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

@end
