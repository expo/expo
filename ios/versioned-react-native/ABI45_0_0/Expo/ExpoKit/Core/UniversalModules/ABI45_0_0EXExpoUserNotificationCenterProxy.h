//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXInternalModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXUserNotificationCenterProxyInterface.h>

@interface ABI45_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI45_0_0EXInternalModule, ABI45_0_0EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI45_0_0EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
