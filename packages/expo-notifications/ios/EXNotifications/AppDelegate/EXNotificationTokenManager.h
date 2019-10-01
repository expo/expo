// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMSingletonModule.h>
#import <EXNotifications/UMNotificationTokenManager.h>

NS_ASSUME_NONNULL_BEGIN

// Listens for token changes and publishes the new token to subscribers

@interface EXNotificationTokenManager : UMSingletonModule <UIApplicationDelegate, UMNotificationTokenManager>

@end

NS_ASSUME_NONNULL_END
