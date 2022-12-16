//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXInternalModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXUserNotificationCenterProxyInterface.h>

@interface ABI46_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI46_0_0EXInternalModule, ABI46_0_0EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI46_0_0EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
