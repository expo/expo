//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXInternalModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUserNotificationCenterProxyInterface.h>

@interface ABI44_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI44_0_0EXInternalModule, ABI44_0_0EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI44_0_0EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
