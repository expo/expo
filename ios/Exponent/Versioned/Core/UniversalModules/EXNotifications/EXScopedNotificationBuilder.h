// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXNotificationBuilder.h>)

#import <EXNotifications/EXNotificationBuilder.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedNotificationBuilder : EXNotificationBuilder

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

#endif
