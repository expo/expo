// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXScopedBridgeModule.h"
#import "ABI24_0_0EXScopedModuleRegistry.h"

@protocol ABI24_0_0EXNotificationsScopedModuleDelegate

- (NSString *)apnsTokenStringForScopedModule:(id)scopedModule;
- (void)getExpoPushTokenForScopedModule:(id)scopedModule
                                success:(void (^)(NSDictionary *))success
                                failure:(void (^)(NSString *))failure;

@end

@interface ABI24_0_0EXNotifications : ABI24_0_0EXScopedBridgeModule

@end
