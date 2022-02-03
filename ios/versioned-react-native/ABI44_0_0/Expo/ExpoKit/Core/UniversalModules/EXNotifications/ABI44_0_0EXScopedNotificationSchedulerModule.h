// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI44_0_0EXNotifications/ABI44_0_0EXNotificationSchedulerModule.h>)

#import <ABI44_0_0EXNotifications/ABI44_0_0EXNotificationSchedulerModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXScopedNotificationSchedulerModule : ABI44_0_0EXNotificationSchedulerModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END

#endif
