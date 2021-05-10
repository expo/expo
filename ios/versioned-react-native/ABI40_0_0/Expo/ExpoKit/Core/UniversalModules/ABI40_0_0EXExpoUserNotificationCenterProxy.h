//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMInternalModule.h>
#import <ABI40_0_0UMPermissionsInterface/ABI40_0_0UMUserNotificationCenterProxyInterface.h>

@interface ABI40_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI40_0_0UMInternalModule, ABI40_0_0UMUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI40_0_0UMUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
