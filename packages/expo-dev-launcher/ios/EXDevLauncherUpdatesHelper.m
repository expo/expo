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
  [requestHeaders addEntriesFromDictionary:[self forwardedHeadersForURL:url]];
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

+ (NSDictionary *)forwardedHeadersForURL:(NSURL *)url
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:NO];
  if (!components.host || !components.scheme) {
    return @{};
  }

  NSString *authority = components.port ? [NSString stringWithFormat:@"%@:%@", components.host, components.port] : components.host;
  NSMutableDictionary *headers = @{
    @"Forwarded": [NSString stringWithFormat:@"host=\"%@\";proto=%@", authority, components.scheme],
    @"X-Forwarded-Host": authority,
    @"X-Forwarded-Proto": components.scheme,
  }.mutableCopy;
  return headers;
}

@end

NS_ASSUME_NONNULL_END
