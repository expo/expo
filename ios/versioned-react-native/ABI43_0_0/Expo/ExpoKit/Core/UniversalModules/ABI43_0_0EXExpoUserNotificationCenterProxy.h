//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXInternalModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUserNotificationCenterProxyInterface.h>

@interface ABI43_0_0EXExpoUserNotificationCenterProxy : NSObject <ABI43_0_0EXInternalModule, ABI43_0_0EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<ABI43_0_0EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
