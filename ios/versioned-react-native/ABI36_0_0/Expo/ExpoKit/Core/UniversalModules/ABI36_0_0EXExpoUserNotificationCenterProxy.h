//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMInternalModule.h>
#import <ABI36_0_0UMPermissionsInterface/ABI36_0_0UMUserNotificationCenterProxyInterface.h>

@interface ABI36_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI36_0_0UMInternalModule, ABI36_0_0UMUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI36_0_0UMUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
