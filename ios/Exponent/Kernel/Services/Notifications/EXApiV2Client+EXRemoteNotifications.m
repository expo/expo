// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXApiV2Client+EXRemoteNotifications.h"
#import "EXKernel+DeviceInstallationUUID.h"
#import "NSData+EXRemoteNotifications.h"
#if __has_include(<EXApplication/EXProvisioningProfile.h>)
#import <EXApplication/EXProvisioningProfile.h>
#endif

@implementation EXApiV2Client (EXRemoteNotifications)

- (NSURLSessionTask *)updateDeviceToken:(NSData *)deviceToken completionHandler:(void (^)(NSError * _Nullable))handler
{
  NSMutableDictionary *arguments = [NSMutableDictionary dictionaryWithDictionary:@{
    @"deviceId": [EXKernel deviceInstallationUUID],
    @"appId": NSBundle.mainBundle.bundleIdentifier,
    @"deviceToken": deviceToken.apnsTokenString,
    @"type": @"apns",
  }];
  // Presence of this file is assured in Expo client
  // and in ejected projects Expo Push Notifications don't work anyway
  // so this codepath shouldn't be executed at all.
#if __has_include(<EXApplication/EXProvisioningProfile.h>)
  NSString *environment = [[EXProvisioningProfile mainProvisioningProfile] notificationServiceEnvironment];
  if (!environment) {
    DDLogWarn(@"aps-environment is missing from the entitlements; ensure that the provisioning profile enables push notifications");
  } else if ([environment isEqualToString:@"development"]) {
    arguments[@"development"] = @YES;
  }
#endif

  
  return [self callRemoteMethod:@"push/updateDeviceToken"
                      arguments:arguments
                     httpMethod:@"POST"
              completionHandler:^(EXApiV2Result * _Nullable response, NSError * _Nullable error) {
                handler(error);
              }];
}


- (NSURLSessionTask *)getExpoPushTokenForExperience:(NSString *)experienceId
                                        deviceToken:(NSData *)deviceToken
                                  completionHandler:(void (^)(NSString * _Nullable, NSError * _Nullable))handler
{
  NSMutableDictionary *arguments = [NSMutableDictionary dictionaryWithDictionary:@{
    @"deviceId": [EXKernel deviceInstallationUUID],
    @"experienceId": experienceId,
    @"appId": NSBundle.mainBundle.bundleIdentifier,
    @"deviceToken": deviceToken.apnsTokenString,
    @"type": @"apns",
  }];
  // Presence of this file is assured in Expo client
  // and in ejected projects Expo Push Notifications don't work anyway
  // so this codepath shouldn't be executed at all.
#if __has_include(<EXApplication/EXProvisioningProfile.h>)
  NSString *environment = [[EXProvisioningProfile mainProvisioningProfile] notificationServiceEnvironment];
  if (!environment) {
    DDLogWarn(@"aps-environment is missing from the entitlements; ensure that the provisioning profile enables push notifications");
  } else if ([environment isEqualToString:@"development"]) {
    arguments[@"development"] = @YES;
  }
#endif
  
  return [self callRemoteMethod:@"push/getExpoPushToken"
                      arguments:arguments
                     httpMethod:@"POST"
              completionHandler:^(EXApiV2Result * _Nullable result, NSError * _Nullable error) {
                if (error) {
                  handler(nil, error);
                  return;
                }
                
                if (![result.data isKindOfClass:[NSDictionary class]]) {
                  handler(nil, [self _errorForMalformedResult:result]);
                  return;
                }
                
                NSDictionary *data = (NSDictionary *)result.data;
                if (![data[@"expoPushToken"] isKindOfClass:[NSString class]]) {
                  handler(nil, [self _errorForMalformedResult:result]);
                  return;
                }
                
                NSString *expoPushToken = (NSString *)data[@"expoPushToken"];
                handler(expoPushToken, nil);
              }];
}

- (NSError *)_errorForMalformedResult:(EXApiV2Result *)result
{
  return [NSError errorWithDomain:EXApiErrorDomain
                             code:EXApiErrorCodeMalformedResponse
                         userInfo:@{
                                    NSLocalizedDescriptionKey: @"The server did not send back an Expo push token",
                                    EXApiResultKey: result,
                                    }];
}

@end
