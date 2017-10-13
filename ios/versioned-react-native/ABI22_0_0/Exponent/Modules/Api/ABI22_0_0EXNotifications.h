// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI22_0_0EXScopedBridgeModule.h"
#import "ABI22_0_0EXScopedModuleRegistry.h"

@protocol ABI22_0_0EXNotificationsScopedModuleDelegate

- (NSString *)apnsTokenStringForScopedModule:(id)scopedModule;
- (void)getExpoPushTokenForScopedModule:(id)scopedModule
                                success:(void (^)(NSDictionary *))success
                                failure:(void (^)(NSString *))failure;

@end

@interface ABI22_0_0EXNotifications : ABI22_0_0EXScopedBridgeModule

@end
