//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMInternalModule.h>
#import <ABI34_0_0UMPermissionsInterface/ABI34_0_0UMUserNotificationCenterProxyInterface.h>

@interface ABI34_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI34_0_0UMInternalModule, ABI34_0_0UMUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI34_0_0UMUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
