// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/UMNotificationsConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@protocol UMNotificationsManager <NSObject>

- (void)addNotificationsConsumer:(id<UMNotificationsConsumer>)consumer;
- (void)removeNotificationsConsumer:(id<UMNotificationsConsumer>)consumer;

@end

NS_ASSUME_NONNULL_END
