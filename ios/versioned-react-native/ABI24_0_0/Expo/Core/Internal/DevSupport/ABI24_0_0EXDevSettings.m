// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXDevSettings.h"
#import "ABI24_0_0EXDevSettingsDataSource.h"

// redefined from ABI24_0_0RCTDevMenu.mm
NSString *const kABI24_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI24_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";

@implementation ABI24_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI24_0_0RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI24_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI24_0_0RCTDevSettingLiveReloadEnabled: @YES,
                                  };
  ABI24_0_0EXDevSettingsDataSource *dataSource = [[ABI24_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

@end
