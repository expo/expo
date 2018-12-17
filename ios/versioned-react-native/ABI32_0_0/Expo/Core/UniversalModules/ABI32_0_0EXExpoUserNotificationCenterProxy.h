//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXInternalModule.h>
#import <ABI32_0_0EXPermissionsInterface/ABI32_0_0EXUserNotificationCenterProxyInterface.h>

@interface ABI32_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI32_0_0EXInternalModule, ABI32_0_0EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI32_0_0EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
