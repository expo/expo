//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMInternalModule.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXUserNotificationCenterProxyInterface.h>

@interface ABI42_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI42_0_0UMInternalModule, ABI42_0_0EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI42_0_0EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
