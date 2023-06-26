//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXInternalModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXUserNotificationCenterProxyInterface.h>

@interface ABI49_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI49_0_0EXInternalModule, ABI49_0_0EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI49_0_0EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
