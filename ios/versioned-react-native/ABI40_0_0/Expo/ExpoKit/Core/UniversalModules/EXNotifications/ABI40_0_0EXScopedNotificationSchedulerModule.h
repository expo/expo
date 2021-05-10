// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI40_0_0EXNotifications/ABI40_0_0EXNotificationSchedulerModule.h>)

#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationSchedulerModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXScopedNotificationSchedulerModule : ABI40_0_0EXNotificationSchedulerModule

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

#endif
