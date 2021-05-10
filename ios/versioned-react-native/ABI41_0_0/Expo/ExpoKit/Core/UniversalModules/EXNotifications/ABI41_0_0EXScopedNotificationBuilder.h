// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI41_0_0EXNotifications/ABI41_0_0EXNotificationBuilder.h>)

#import <ABI41_0_0EXNotifications/ABI41_0_0EXNotificationBuilder.h>
#import "ABI41_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXScopedNotificationBuilder : ABI41_0_0EXNotificationBuilder

- (instancetype)initWithExperienceId:(NSString *)experienceId
                 andConstantsBinding:(ABI41_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END

#endif
