// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXNotifications.h"
#import <UMPermissionsInterface/UMUserNotificationCenterProxyInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUserNotificationCenter : NSObject <EXUserNotificationCenterService, UMUserNotificationCenterProxyInterface>

@end

NS_ASSUME_NONNULL_END
