// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedNotifications : EXNotifications

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
