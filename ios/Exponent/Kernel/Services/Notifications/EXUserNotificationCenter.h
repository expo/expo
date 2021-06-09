// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXUserNotificationCenterProxyInterface.h>

#import "EXNotifications.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXUserNotificationCenter : NSObject <EXUserNotificationCenterService, EXUserNotificationCenterProxyInterface>

@end

NS_ASSUME_NONNULL_END
