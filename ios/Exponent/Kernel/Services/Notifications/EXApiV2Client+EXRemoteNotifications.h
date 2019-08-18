// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXApiV2Client.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXApiV2Client (EXRemoteNotifications)

- (NSURLSessionTask *)updateDeviceToken:(NSData *)deviceToken
                      completionHandler:(void (^)(NSError * _Nullable postError))handler;
- (NSURLSessionTask *)getExpoPushTokenForExperience:(NSString *)experienceId
                                        deviceToken:(NSData *)deviceToken
                                  completionHandler:(void (^)(NSString * _Nullable expoPushToken, NSError * _Nullable error))handler;
@end

NS_ASSUME_NONNULL_END

