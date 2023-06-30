// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXDevLauncher/EXDevLauncherUpdatesHelper.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXDevLauncherUpdatesHelper

+ (NSDictionary *)createUpdatesConfigurationWithURL:(NSURL *)url
                                         projectURL:(NSURL *)projectURL
                                     installationID:(NSString *)installationID
{
  NSMutableDictionary *requestHeaders = @{@"Expo-Updates-Environment": @"DEVELOPMENT"}.mutableCopy;
  if (installationID) {
    requestHeaders[@"Expo-Dev-Client-ID"] = installationID;
  }

  return @{
    @"EXUpdatesURL": url.absoluteString,
    @"EXUpdatesScopeKey": projectURL.absoluteString,
    @"EXUpdatesLaunchWaitMs": @(60000),
    @"EXUpdatesCheckOnLaunch": @"ALWAYS",
    @"EXUpdatesHasEmbeddedUpdate": @(NO),
    @"EXUpdatesEnabled": @(YES),
    @"EXUpdatesRequestHeaders": requestHeaders,
    @"EXUpdatesExpectsSignedManifest": @(NO),
  };
}

@end

NS_ASSUME_NONNULL_END
