// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXNotificationCategoriesModule.h>)

#import <EXNotifications/EXNotificationCategoriesModule.h>
#import "EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedNotificationCategoriesModule : EXNotificationCategoriesModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
                 andConstantsBinding:(EXConstantsBinding *)constantsBinding;

+ (void)maybeMigrateLegacyCategoryIdentifiersForProject:(NSString *)experienceId
                                             isInExpoGo:(BOOL)isInExpoGo;

@end

NS_ASSUME_NONNULL_END

#endif
