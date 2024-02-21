// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXDevLauncher/EXDevLauncherUpdatesHelper.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXDevLauncherUpdatesHelper

+ (NSDictionary *)createUpdatesConfigurationWithURL:(NSURL *)url
                                         projectURL:(NSURL *)projectURL
                                     runtimeVersion:(NSString *)runtimeVersion
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
    @"EXUpdatesRuntimeVersion": runtimeVersion,
  };
}

+ (NSString *)getUpdatesConfigForKey:(NSString *)key
{
  NSString *value = @"";
  NSString *path = [[NSBundle mainBundle] pathForResource:@"Expo" ofType:@"plist"];

  if (path != nil) {
    NSDictionary *expoConfig = [NSDictionary dictionaryWithContentsOfFile:path];

    if (expoConfig != nil) {
      value = [expoConfig objectForKey:key] ?: @"";
    }
  }

  return value;
}

@end

NS_ASSUME_NONNULL_END
