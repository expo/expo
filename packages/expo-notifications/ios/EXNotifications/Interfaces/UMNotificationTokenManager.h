// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/UMNotificationTokenListener.h>

@protocol UMNotificationTokenManager

- (void)addListener:(id<UMNotificationTokenListener>)listener;
- (void)removeListener:(id<UMNotificationTokenListener>)listener;

@end
