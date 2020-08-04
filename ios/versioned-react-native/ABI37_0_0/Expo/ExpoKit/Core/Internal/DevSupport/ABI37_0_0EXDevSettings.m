// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI37_0_0EXDevSettings.h"
#import "ABI37_0_0EXDevSettingsDataSource.h"

// redefined from ABI37_0_0RCTDevMenu.mm
NSString *const kABI37_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI37_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI37_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation ABI37_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI37_0_0RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI37_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI37_0_0RCTDevSettingHotLoadingEnabled: @YES,
                                  kABI37_0_0RCTDevSettingLiveReloadEnabled: @NO,
                                  };
  ABI37_0_0EXDevSettingsDataSource *dataSource = [[ABI37_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

@end
