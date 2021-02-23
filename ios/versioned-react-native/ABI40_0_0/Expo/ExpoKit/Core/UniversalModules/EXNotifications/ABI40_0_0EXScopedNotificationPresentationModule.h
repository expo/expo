// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI40_0_0EXNotifications/ABI40_0_0EXNotificationPresentationModule.h>)

#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationPresentationModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXScopedNotificationPresentationModule : ABI40_0_0EXNotificationPresentationModule

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

#endif
