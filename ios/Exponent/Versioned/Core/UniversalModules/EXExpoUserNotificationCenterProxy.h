//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMInternalModule.h>
#import <UMPermissionsInterface/UMUserNotificationCenterProxyInterface.h>

@interface EXExpoUserNotificationCenterProxy : NSObject <UMInternalModule, UMUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<UMUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
