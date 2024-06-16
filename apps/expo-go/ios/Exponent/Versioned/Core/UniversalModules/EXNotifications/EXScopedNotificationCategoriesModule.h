// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXNotificationCategoriesModule.h>)

#import <EXNotifications/EXNotificationCategoriesModule.h>
#import "EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedNotificationCategoriesModule : EXNotificationCategoriesModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

+ (void)maybeMigrateLegacyCategoryIdentifiersForProjectWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                                                           scopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END

#endif
