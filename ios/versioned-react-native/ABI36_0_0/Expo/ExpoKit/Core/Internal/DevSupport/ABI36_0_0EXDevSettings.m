// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI36_0_0EXDevSettings.h"
#import "ABI36_0_0EXDevSettingsDataSource.h"

// redefined from ABI36_0_0RCTDevMenu.mm
NSString *const kABI36_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI36_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI36_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation ABI36_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI36_0_0RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI36_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI36_0_0RCTDevSettingHotLoadingEnabled: @YES,
                                  kABI36_0_0RCTDevSettingLiveReloadEnabled: @NO,
                                  };
  ABI36_0_0EXDevSettingsDataSource *dataSource = [[ABI36_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

@end
