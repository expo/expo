//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMInternalModule.h>
#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMUserNotificationCenterProxyInterface.h>

@interface ABI37_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI37_0_0UMInternalModule, ABI37_0_0UMUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI37_0_0UMUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
