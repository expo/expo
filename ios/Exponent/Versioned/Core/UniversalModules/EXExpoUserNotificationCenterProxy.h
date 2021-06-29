//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMInternalModule.h>
#import <ExpoModulesCore/EXUserNotificationCenterProxyInterface.h>

@interface EXExpoUserNotificationCenterProxy : NSObject <UMInternalModule, EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
