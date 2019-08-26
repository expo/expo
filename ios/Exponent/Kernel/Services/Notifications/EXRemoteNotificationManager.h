// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXUserNotificationCenter.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXRemoteNotificationManager : NSObject

- (instancetype)initWithUserNotificationCenter:(EXUserNotificationCenter *)userNotificationCenter;
- (void)registerForRemoteNotifications;
- (void)registerAPNSToken:(nullable NSData *)token registrationError:(nullable NSError *)error;
- (BOOL)supportsCurrentRuntimeEnvironment;

- (NSString *)apnsTokenStringForScopedModule:(id)scopedModule;
- (void)getExpoPushTokenForScopedModule:(id)scopedModule
                      completionHandler:(void (^)(NSString * _Nullable pushToken, NSError * _Nullable error))handler;

@end

NS_ASSUME_NONNULL_END
