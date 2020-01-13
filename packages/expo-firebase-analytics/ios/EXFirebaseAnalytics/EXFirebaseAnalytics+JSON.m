// Copyright 2020-present 650 Industries. All rights reserved.

#import <EXFirebaseAnalytics/EXFirebaseAnalytics+JSON.h>

@implementation EXFirebaseAnalytics (JSON)

+ (NSDictionary *)firOptionsNativeToJSON:(FIROptions * _Nonnull)input
{
    return @{
        @"androidClientID": input.androidClientID,
        @"apiKey": input.APIKey,
        @"appId": input.googleAppID,
        @"clientId": input.clientID,
        @"databaseURL": input.databaseURL,
        @"deepLinkUrlScheme": input.deepLinkURLScheme,
        @"messagingSenderId": input.GCMSenderID,
        @"projectId": input.projectID,
        @"storageBucket": input.storageBucket,
        @"trackingId": input.trackingID,
    };
}

+ (nullable FIROptions *)firOptionsJSONToNative:(nullable NSDictionary *)input
{
    if (!input) return nil;
    
    FIROptions *firOptions = [[FIROptions alloc] initWithGoogleAppID:input[@"appId"] GCMSenderID:input[@"messagingSenderId"]];
         
    firOptions.APIKey = input[@"apiKey"];
    firOptions.projectID = input[@"projectId"];
    firOptions.clientID = input[@"clientId"];
    firOptions.trackingID = input[@"trackingId"];
    firOptions.databaseURL = input[@"databaseURL"];
    firOptions.storageBucket = input[@"storageBucket"];
    firOptions.androidClientID = input[@"androidClientId"];
    firOptions.deepLinkURLScheme = input[@"deepLinkURLScheme"];
    
    return firOptions;
}
@end
