// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXScopedBridgeModule.h"
#import "ABI25_0_0EXScopedModuleRegistry.h"

@protocol ABI25_0_0EXNotificationsScopedModuleDelegate

- (NSString *)apnsTokenStringForScopedModule:(id)scopedModule;
- (void)getExpoPushTokenForScopedModule:(id)scopedModule
                                success:(void (^)(NSDictionary *))success
                                failure:(void (^)(NSString *))failure;

@end

@interface ABI25_0_0EXNotifications : ABI25_0_0EXScopedBridgeModule

@end
