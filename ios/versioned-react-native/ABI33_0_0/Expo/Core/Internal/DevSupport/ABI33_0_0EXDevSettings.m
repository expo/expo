// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI33_0_0EXDevSettings.h"
#import "ABI33_0_0EXDevSettingsDataSource.h"

// redefined from ABI33_0_0RCTDevMenu.mm
NSString *const kABI33_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI33_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";

@implementation ABI33_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI33_0_0RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI33_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI33_0_0RCTDevSettingLiveReloadEnabled: @YES,
                                  };
  ABI33_0_0EXDevSettingsDataSource *dataSource = [[ABI33_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

@end
