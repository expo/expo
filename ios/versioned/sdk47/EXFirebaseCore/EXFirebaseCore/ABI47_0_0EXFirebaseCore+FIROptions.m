//  Copyright © 2020 650 Industries. All rights reserved.

#import <ABI47_0_0EXFirebaseCore/ABI47_0_0EXFirebaseCore+FIROptions.h>

@implementation ABI47_0_0EXFirebaseCore (FIROptions)

+ (BOOL)compareString:(nullable NSString *) str1 to:(nullable NSString *) str2 {
  if (str1 == str2) return YES;
  if (!str1 || !str2) return NO;
  return [str1 isEqualToString:str2];
}

+ (BOOL)areFirOptions:(nullable FIROptions *)options1 equalTo:(nullable FIROptions *)options2
{
  if (options1 == options2) return YES;
  if (!options1 || !options2) return NO;
  return [self.class compareString:options1.androidClientID to:options2.androidClientID]
    && [self.class compareString:options1.APIKey to:options2.APIKey]
    && [self.class compareString:options1.appGroupID to:options2.appGroupID]
    && [self.class compareString:options1.bundleID to:options2.bundleID]
    && [self.class compareString:options1.clientID to:options2.clientID]
    && [self.class compareString:options1.databaseURL to:options2.databaseURL]
    && [self.class compareString:options1.deepLinkURLScheme to:options2.deepLinkURLScheme]
    && [self.class compareString:options1.GCMSenderID to:options2.GCMSenderID]
    && [self.class compareString:options1.googleAppID to:options2.googleAppID]
    && [self.class compareString:options1.projectID to:options2.projectID]
    && [self.class compareString:options1.storageBucket to:options2.storageBucket]
    && [self.class compareString:options1.trackingID to:options2.trackingID];
}

+ (nonnull NSDictionary *)firOptionsToJSON:(nonnull FIROptions *)options
{
  NSMutableDictionary* json = [NSMutableDictionary dictionary];
  
  if (options.androidClientID) [json setValue:options.androidClientID forKey:@"androidClientId"];
  if (options.APIKey) [json setValue:options.APIKey forKey:@"apiKey"];
  if (options.googleAppID) [json setValue:options.googleAppID forKey:@"appId"];
  if (options.clientID) [json setValue:options.clientID forKey:@"clientId"];
  if (options.databaseURL) [json setValue:options.databaseURL forKey:@"databaseURL"];
  if (options.deepLinkURLScheme) [json setValue:options.deepLinkURLScheme forKey:@"deepLinkUrlScheme"];
  if (options.GCMSenderID) [json setValue:options.GCMSenderID forKey:@"messagingSenderId"];
  if (options.projectID) [json setValue:options.projectID forKey:@"projectId"];
  if (options.storageBucket) [json setValue:options.storageBucket forKey:@"storageBucket"];
  if (options.trackingID) [json setValue:options.trackingID forKey:@"trackingId"];
  if (options.appGroupID) [json setValue:options.trackingID forKey:@"appGroupId"];

  return json;
}

@end
