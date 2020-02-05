//  Copyright © 2020 650 Industries. All rights reserved.

#import <EXFirebaseCore/EXFirebaseCore+FIROptions.h>

@implementation EXFirebaseCore (FIROptions)

+ (BOOL) compareString:(nullable NSString*) str1 str2:(nullable NSString*) str2 {
  if (str1 == str2) return YES;
  if (!str1 || !str2) return NO;
  return [str1 isEqualToString:str2];
}

+ (BOOL) firOptionsIsEqualTo:(nullable FIROptions*)options1 compareTo:(nullable FIROptions*)options2
{
  if (!options1 && !options2) return YES;
  if ((options1 && !options2) || (!options1 && options2)) return NO;
  return [self.class compareString:options1.androidClientID str2:options2.androidClientID]
    && [self.class compareString:options1.APIKey str2:options2.APIKey]
    && [self.class compareString:options1.appGroupID str2:options2.appGroupID]
    && [self.class compareString:options1.bundleID str2:options2.bundleID]
    && [self.class compareString:options1.clientID str2:options2.clientID]
    && [self.class compareString:options1.databaseURL str2:options2.databaseURL]
    && [self.class compareString:options1.deepLinkURLScheme str2:options2.deepLinkURLScheme]
    && [self.class compareString:options1.GCMSenderID str2:options2.GCMSenderID]
    && [self.class compareString:options1.googleAppID str2:options2.googleAppID]
    && [self.class compareString:options1.projectID str2:options2.projectID]
    && [self.class compareString:options1.storageBucket str2:options2.storageBucket]
    && [self.class compareString:options1.trackingID str2:options2.trackingID];
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

+ (nullable FIROptions *)firOptionsWithJSON:(nullable NSDictionary *)json
{
    if (!json) return nil;
    
    FIROptions *firOptions = [[FIROptions alloc] initWithGoogleAppID:json[@"appId"] GCMSenderID:json[@"messagingSenderId"]];
         
    firOptions.APIKey = json[@"apiKey"];
    firOptions.projectID = json[@"projectId"];
    firOptions.clientID = json[@"clientId"];
    firOptions.trackingID = json[@"trackingId"];
    firOptions.databaseURL = json[@"databaseURL"];
    firOptions.storageBucket = json[@"storageBucket"];
    firOptions.androidClientID = json[@"androidClientId"];
    firOptions.deepLinkURLScheme = json[@"deepLinkURLScheme"];
    firOptions.androidClientID = json[@"androidClientId"];
    firOptions.appGroupID = json[@"appGroupId"];
    
    return firOptions;
}

@end
