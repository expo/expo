// Copyright 2015-present 650 Industries. All rights reserved.
#import "EXDevMenuBuildInfo.h"

@implementation EXDevMenuBuildInfo

+(NSDictionary *)getBuildInfoForBridge:(RCTBridge *)bridge andManifest:(NSDictionary *)manifest
{
  NSMutableDictionary *buildInfo = [NSMutableDictionary new];

  NSString *appIcon = [EXDevMenuBuildInfo getAppIcon];
  NSString *runtimeVersion = [EXDevMenuBuildInfo getUpdatesConfigForKey:@"EXUpdatesRuntimeVersion"];
  NSString *sdkVersion = [EXDevMenuBuildInfo getUpdatesConfigForKey:@"EXUpdatesSDKVersion"];
  NSString *appVersion = [EXDevMenuBuildInfo getFormattedAppVersion];
  NSString *appName = [[NSBundle mainBundle] objectForInfoDictionaryKey: @"CFBundleDisplayName"] ?: [[NSBundle mainBundle] objectForInfoDictionaryKey: @"CFBundleExecutable"];
  NSString *hostUrl = [bridge.bundleURL host] ?: @"";

  if (manifest[@"appName"] != nil) {
    appName = manifest[@"appName"];
  }
  
  if (manifest[@"appVersion"] != nil) {
    appVersion = manifest[@"appVersion"];
  }
  
  if (manifest[@"hostUrl"] != nil) {
    hostUrl = manifest[@"hostUrl"];
  }

  buildInfo[@"appName"] = appName;
  buildInfo[@"appIcon"] = appIcon;
  buildInfo[@"appVersion"] = appVersion;
  buildInfo[@"runtimeVersion"] = runtimeVersion;
  buildInfo[@"sdkVersion"] = sdkVersion;
  buildInfo[@"hostUrl"] = hostUrl;

  return buildInfo;
}

+(NSString *)getAppIcon
{
  NSString *appIcon = @"";
  NSString *appIconName = [[[[[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleIcons"] objectForKey:@"CFBundlePrimaryIcon"] objectForKey:@"CFBundleIconFiles"]  lastObject];
  
  if (appIconName != nil) {
    NSString *resourcePath = [[NSBundle mainBundle] resourcePath];
    NSString *appIconPath = [[resourcePath stringByAppendingString:appIconName] stringByAppendingString:@".png"];
    appIcon = [@"file://" stringByAppendingString:appIconPath];
  }
  
  return appIcon;
}

+(NSString *)getUpdatesConfigForKey:(NSString *)key
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

+(NSString *)getFormattedAppVersion
{
  NSString *shortVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  NSString *buildVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"];
  NSString *appVersion = [NSString stringWithFormat:@"%@ (%@)", shortVersion, buildVersion];
  return appVersion;
}

@end
