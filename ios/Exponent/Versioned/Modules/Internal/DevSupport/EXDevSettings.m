// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevSettings.h"
#import "EXDevSettingsDataSource.h"

// redefined from RCTDevMenu.mm
NSString *const kRCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kRCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";

@implementation EXDevSettings

+ (NSString *)moduleName { return @"RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kRCTDevSettingShakeToShowDevMenu: @YES,
                                  kRCTDevSettingLiveReloadEnabled: @YES,
                                  };
  EXDevSettingsDataSource *dataSource = [[EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

@end
