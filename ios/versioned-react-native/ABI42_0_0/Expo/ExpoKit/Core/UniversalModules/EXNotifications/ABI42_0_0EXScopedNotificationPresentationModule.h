// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI42_0_0EXNotifications/ABI42_0_0EXNotificationPresentationModule.h>)

#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationPresentationModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXScopedNotificationPresentationModule : ABI42_0_0EXNotificationPresentationModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END

#endif
