// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI46_0_0EXNotifications/ABI46_0_0EXNotificationSchedulerModule.h>)

#import <ABI46_0_0EXNotifications/ABI46_0_0EXNotificationSchedulerModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXScopedNotificationSchedulerModule : ABI46_0_0EXNotificationSchedulerModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END

#endif
