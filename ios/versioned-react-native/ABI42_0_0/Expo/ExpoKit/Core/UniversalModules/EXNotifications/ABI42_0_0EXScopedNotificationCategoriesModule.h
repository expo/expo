// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI42_0_0EXNotifications/ABI42_0_0EXNotificationCategoriesModule.h>)

#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationCategoriesModule.h>
#import "ABI42_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXScopedNotificationCategoriesModule : ABI42_0_0EXNotificationCategoriesModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
                 andConstantsBinding:(ABI42_0_0EXConstantsBinding *)constantsBinding;

+ (void)maybeMigrateLegacyCategoryIdentifiersForProject:(NSString *)experienceId
                                             isInExpoGo:(BOOL)isInExpoGo;

@end

NS_ASSUME_NONNULL_END

#endif
