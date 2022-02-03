// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI43_0_0EXNotifications/ABI43_0_0EXNotificationsHandlerModule.h>)

#import <ABI43_0_0EXNotifications/ABI43_0_0EXNotificationsHandlerModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXScopedNotificationsHandlerModule : ABI43_0_0EXNotificationsHandlerModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END

#endif
