// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXDevSettings.h"
#import "ABI30_0_0EXDevSettingsDataSource.h"

// redefined from ABI30_0_0RCTDevMenu.mm
NSString *const kABI30_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI30_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";

@implementation ABI30_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI30_0_0RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI30_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI30_0_0RCTDevSettingLiveReloadEnabled: @YES,
                                  };
  ABI30_0_0EXDevSettingsDataSource *dataSource = [[ABI30_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

@end
