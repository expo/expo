// Copyright 2021-present 650 Industries. All rights reserved.

#import "EXDevLauncherUpdatesHelper.h"

NS_ASSUME_NONNULL_BEGIN

@implementation EXDevLauncherUpdatesHelper

+ (NSDictionary *)createUpdatesConfigurationWithURL:(NSURL *)url
{
  NSString *urlString = url.absoluteString;
  return @{
    @"EXUpdatesURL": urlString,
    @"EXUpdatesScopeKey": urlString,
    @"EXUpdatesLaunchWaitMs": @(60000),
    @"EXUpdatesCheckOnLaunch": @"ALWAYS",
    @"EXUpdatesHasEmbeddedUpdate": @(NO),
    @"EXUpdatesEnabled": @(YES),
    @"EXUpdatesRequestHeaders": @{
      @"Expo-Updates-Environment": @"DEVELOPMENT"
    }
  };
}

@end

NS_ASSUME_NONNULL_END
