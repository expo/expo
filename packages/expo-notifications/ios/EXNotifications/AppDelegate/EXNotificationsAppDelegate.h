// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

// Sets up EXUserNotificationManager as UNNotificationCenter.delegate

@interface EXNotificationsAppDelegate : UMSingletonModule <UIApplicationDelegate>

@end

NS_ASSUME_NONNULL_END
