// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI29_0_0EXScopedBridgeModule.h"
#import "ABI29_0_0EXScopedModuleRegistry.h"

NS_ASSUME_NONNULL_BEGIN

@protocol ABI29_0_0EXNotificationsScopedModuleDelegate

- (NSString *)apnsTokenStringForScopedModule:(id)scopedModule;
- (void)getExpoPushTokenForScopedModule:(id)scopedModule
                                success:(void (^)(NSDictionary *))success
                                failure:(void (^)(NSString *))failure DEPRECATED_MSG_ATTRIBUTE("Use -[getExpoPushTokenForScopedModule:completionHandler] instead");
- (void)getExpoPushTokenForScopedModule:(id)scopedModule
                      completionHandler:(void (^)(NSString * _Nullable pushToken, NSError * _Nullable error))handler;

@end

@interface ABI29_0_0EXNotifications : ABI29_0_0EXScopedBridgeModule

@end

NS_ASSUME_NONNULL_END
