// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
NS_ASSUME_NONNULL_BEGIN

@protocol EXRemoteNotificationPermissionDelegate

- (void)handleDidFinishRegisteringForRemoteNotifications;

@end

@protocol EXRemoteNotificationPermissionProgressPublisher

- (void)addDelegate:(id<EXRemoteNotificationPermissionDelegate>)delegate;
- (void)removeDelegate:(id<EXRemoteNotificationPermissionDelegate>)delegate;

@end

NS_ASSUME_NONNULL_END
