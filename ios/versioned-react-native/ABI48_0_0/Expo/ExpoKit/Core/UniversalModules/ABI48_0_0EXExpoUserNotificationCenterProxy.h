//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXInternalModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXUserNotificationCenterProxyInterface.h>

@interface ABI48_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI48_0_0EXInternalModule, ABI48_0_0EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI48_0_0EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
