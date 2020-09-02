// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI39_0_0EXDevSettings.h"
#import "ABI39_0_0EXDevSettingsDataSource.h"

// redefined from ABI39_0_0RCTDevMenu.mm
NSString *const kABI39_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI39_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI39_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";

@implementation ABI39_0_0EXDevSettings

+ (NSString *)moduleName { return @"ABI39_0_0RCTDevSettings"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId isDevelopment:(BOOL)isDevelopment
{
  NSDictionary *defaultValues = @{
                                  kABI39_0_0RCTDevSettingShakeToShowDevMenu: @YES,
                                  kABI39_0_0RCTDevSettingHotLoadingEnabled: @YES,
                                  kABI39_0_0RCTDevSettingLiveReloadEnabled: @NO,
                                  };
  ABI39_0_0EXDevSettingsDataSource *dataSource = [[ABI39_0_0EXDevSettingsDataSource alloc] initWithDefaultValues:defaultValues
                                                                               forExperienceId:experienceId
                                                                                 isDevelopment:isDevelopment];
  return [super initWithDataSource:dataSource];
}

- (NSArray<NSString *> *)supportedEvents
{
  return [super supportedEvents];
}

@end
