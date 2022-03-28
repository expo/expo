// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXUpdatesDevExtension.h"

@implementation EXUpdatesDevExtension

RCT_EXPORT_MODULE(EXUpdatesDevExtension)

RCT_EXPORT_METHOD(getUpdatesConfigAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSMutableDictionary *updatesConfig = [NSMutableDictionary new];
  
  NSString *runtimeVersion = [self getUpdatesConfigForKey:@"EXUpdatesRuntimeVersion"];
  NSString *sdkVersion = [self getUpdatesConfigForKey:@"EXUpdatesSDKVersion"];
  
  // url structure for EASUpdates: `http://u.expo.dev/{appId}`
  // this url field is added to app.json.updates when running `eas update:configure`
  // the `u.expo.dev` determines that it is the modern manifest protocol
  NSString *updatesUrl = [self getUpdatesConfigForKey:@"EXUpdatesURL"];
  NSURL *url = [NSURL URLWithString:updatesUrl];
  NSString *appId = [[url pathComponents] lastObject];
  
  BOOL isModernManifestProtocol = [[url host] hasPrefix:@"u.expo.dev"];
  
  [updatesConfig setObject:runtimeVersion forKey:@"runtimeVersion"];
  [updatesConfig setObject:sdkVersion forKey:@"sdkVersion"];
  [updatesConfig setObject:appId forKey:@"appId"];
  [updatesConfig setObject:@(isModernManifestProtocol) forKey:@"isEASUpdates"];
  
  resolve(updatesConfig);
}


-(NSString *)getUpdatesConfigForKey:(NSString *)key
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
