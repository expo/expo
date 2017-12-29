// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI22_0_0EXDevSettings.h"
#import "ABI22_0_0EXDevSettingsDataSource.h"

// redefined from ABI22_0_0RCTDevMenu.mm
NSString *const kABI22_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI22_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";

@implementation ABI22_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI22_0_0RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI22_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI22_0_0RCTDevSettingLiveReloadEnabled: @YES,
                                  };
  ABI22_0_0EXDevSettingsDataSource *dataSource = [[ABI22_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

@end
