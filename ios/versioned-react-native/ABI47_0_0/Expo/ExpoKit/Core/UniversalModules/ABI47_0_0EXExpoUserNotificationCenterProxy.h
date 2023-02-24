//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXInternalModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUserNotificationCenterProxyInterface.h>

@interface ABI47_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI47_0_0EXInternalModule, ABI47_0_0EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI47_0_0EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
