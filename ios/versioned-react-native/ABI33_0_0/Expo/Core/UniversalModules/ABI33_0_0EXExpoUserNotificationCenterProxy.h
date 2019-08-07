//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMInternalModule.h>
#import <ABI33_0_0UMPermissionsInterface/ABI33_0_0UMUserNotificationCenterProxyInterface.h>

@interface ABI33_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI33_0_0UMInternalModule, ABI33_0_0UMUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI33_0_0UMUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
