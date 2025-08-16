// Copyright 2015-present 650 Industries. All rights reserved.
#import <EXDevMenu/EXDevMenuAppInfo.h>
#import <React/RCTBridge+Private.h>
#if __has_include(<EXDevMenu/EXDevMenu-Swift.h>)
#import <EXDevMenu/EXDevMenu-Swift.h>
#else
#import <EXDevMenu-Swift.h>
#endif

@import EXManifests;

@implementation EXDevMenuAppInfo

+(NSDictionary *)getAppInfo
{
  NSMutableDictionary *appInfo = [NSMutableDictionary new];

  NSString *appIcon = [EXDevMenuAppInfo getAppIcon];
  NSString *runtimeVersion = @"";
  NSString *appVersion = [EXDevMenuAppInfo getFormattedAppVersion];
  NSString *appName = [[NSBundle mainBundle] objectForInfoDictionaryKey: @"CFBundleDisplayName"] ?: [[NSBundle mainBundle] objectForInfoDictionaryKey: @"CFBundleExecutable"];

  DevMenuManager *manager = [DevMenuManager shared];

  if (manager.currentManifest != nil) {
    appName = [manager.currentManifest name];
    appVersion = [manager.currentManifest version];

    if ([manager.currentManifest isKindOfClass:[EXManifestsExpoUpdatesManifest class]]) {
      runtimeVersion = [(EXManifestsExpoUpdatesManifest *)manager.currentManifest runtimeVersion];
    }
  }

  NSString *engine;
  NSString *bridgeDescription = [[[manager currentBridge] batchedBridge] bridgeDescription];

  // In bridgeless mode the bridgeDescription always is "BridgeProxy" instead of actual engine name
  if ([bridgeDescription containsString:@"BridgeProxy"]) {
  #if USE_HERMES
    engine = @"Hermes";
  #else
    engine = @"JSC";
  #endif
  } else if ([bridgeDescription containsString:@"Hermes"]) {
    engine = @"Hermes";
  } else if ([bridgeDescription containsString:@"V8"]) {
    engine = @"V8";
  } else {
    engine = @"JSC";
  }

  NSString *hostUrl = [manager.currentManifestURL absoluteString] ?: @"";

  appInfo[@"appName"] = appName;
  appInfo[@"appIcon"] = appIcon;
  appInfo[@"appVersion"] = appVersion;
  appInfo[@"runtimeVersion"] = runtimeVersion;
  appInfo[@"hostUrl"] = hostUrl;
  appInfo[@"engine"] = engine;

  return appInfo;
}

+(NSString *)getAppIcon
{
  NSString *appIcon = @"";
  NSString *appIconName = nil;
  // For some projects, the CFBundlePrimaryIcon value can be a string, leading to a crash
  // We wrap this in a try/catch to prevent the crash
  @try {
    appIconName = [[[[[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleIcons"] objectForKey:@"CFBundlePrimaryIcon"] objectForKey:@"CFBundleIconFiles"]  lastObject];
  } @catch(NSException *_e) {}

  if (appIconName != nil) {
    NSString *resourcePath = [[NSBundle mainBundle] resourcePath];
    NSString *appIconPath = [resourcePath stringByAppendingPathComponent:[appIconName stringByAppendingPathExtension:@"png"]];
    appIcon = [@"file://" stringByAppendingString:appIconPath];
  }

  return appIcon;
}

+(NSString *)getFormattedAppVersion
{
  NSString *shortVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  NSString *buildVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"];
  NSString *appVersion = [NSString stringWithFormat:@"%@ (%@)", shortVersion, buildVersion];
  return appVersion;
}

@end
