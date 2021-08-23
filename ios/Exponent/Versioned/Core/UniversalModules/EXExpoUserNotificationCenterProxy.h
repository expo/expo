//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXUserNotificationCenterProxyInterface.h>

@interface EXExpoUserNotificationCenterProxy : NSObject <EXInternalModule, EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
