//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXInternalModule.h>
#import <EXPermissionsInterface/EXUserNotificationCenterProxyInterface.h>

@interface EXExpoUserNotificationCenterProxy : NSObject <EXInternalModule, EXUserNotificationCenterProxyInterface>

- (instancetype)initWithUserNotificationCenter:(id<EXUserNotificationCenterProxyInterface>)userNotificationCenter;

@end
