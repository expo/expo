// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXNotificationSchedulerModule.h>)

#import <EXNotifications/EXNotificationSchedulerModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedNotificationSchedulerModule : EXNotificationSchedulerModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END

#endif
