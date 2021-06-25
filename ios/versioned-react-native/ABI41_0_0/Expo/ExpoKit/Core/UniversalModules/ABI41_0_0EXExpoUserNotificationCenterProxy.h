//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>
#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMUserNotificationCenterProxyInterface.h>

@interface ABI41_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI41_0_0UMInternalModule, ABI41_0_0UMUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI41_0_0UMUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
