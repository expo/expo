// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXApiV2Client+EXRemoteNotifications.h"
#import "EXKernel.h"
#import "EXProvisioningProfile.h"
#import "NSData+EXRemoteNotifications.h"

@implementation EXApiV2Client (EXRemoteNotifications)

- (NSURLSessionTask *)updateDeviceToken:(NSData *)deviceToken completionHandler:(void (^)(NSError * _Nullable))handler
{
  NSMutableDictionary *arguments = [NSMutableDictionary dictionaryWithDictionary:@{
    @"deviceId": [EXKernel deviceInstallUUID],
    @"appId": NSBundle.mainBundle.bundleIdentifier,
    @"deviceToken": deviceToken.apnsTokenString,
    @"type": @"apns",
  }];
  if ([EXProvisioningProfile mainProvisioningProfile].development) {
    arguments[@"development"] = @YES;
  }
  
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
    @"deviceId": [EXKernel deviceInstallUUID],
    @"experienceId": experienceId,
    @"appId": NSBundle.mainBundle.bundleIdentifier,
    @"deviceToken": deviceToken.apnsTokenString,
    @"type": @"apns",
  }];
  if ([EXProvisioningProfile mainProvisioningProfile].development) {
    arguments[@"development"] = @YES;
  }
  
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
