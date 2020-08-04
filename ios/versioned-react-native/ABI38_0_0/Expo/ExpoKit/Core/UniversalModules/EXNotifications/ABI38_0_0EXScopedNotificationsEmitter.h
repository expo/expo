// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI38_0_0EXNotifications/ABI38_0_0EXNotificationsEmitter.h>)

#import <ABI38_0_0EXNotifications/ABI38_0_0EXNotificationsEmitter.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI38_0_0EXScopedNotificationsEmitter : ABI38_0_0EXNotificationsEmitter

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

#endif
