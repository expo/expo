// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI39_0_0EXNotifications/ABI39_0_0EXNotificationsEmitter.h>)

#import <ABI39_0_0EXNotifications/ABI39_0_0EXNotificationsEmitter.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXScopedNotificationsEmitter : ABI39_0_0EXNotificationsEmitter

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

#endif
