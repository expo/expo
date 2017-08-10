// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI20_0_0EXScopedBridgeModule.h"
#import "ABI20_0_0EXScopedModuleRegistry.h"

@protocol ABI20_0_0EXNotificationsScopedModuleDelegate

- (NSString *)apnsTokenStringForScopedModule:(id)scopedModule;
- (void)getExpoPushTokenForScopedModule:(id)scopedModule
                                success:(void (^)(NSDictionary *))success
                                failure:(void (^)(NSString *))failure;

@end

@interface ABI20_0_0EXNotifications : ABI20_0_0EXScopedBridgeModule

@end
