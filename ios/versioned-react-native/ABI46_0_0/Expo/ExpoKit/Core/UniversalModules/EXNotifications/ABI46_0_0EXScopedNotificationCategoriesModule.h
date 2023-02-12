// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI46_0_0EXNotifications/ABI46_0_0EXNotificationCategoriesModule.h>)

#import <ABI46_0_0EXNotifications/ABI46_0_0EXNotificationCategoriesModule.h>
#import "ABI46_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXScopedNotificationCategoriesModule : ABI46_0_0EXNotificationCategoriesModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

+ (void)maybeMigrateLegacyCategoryIdentifiersForProjectWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                                                 scopeKey:(NSString *)scopeKey
                                                                         isInExpoGo:(BOOL)isInExpoGo;

@end

NS_ASSUME_NONNULL_END

#endif
