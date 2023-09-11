// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI47_0_0EXNotifications/ABI47_0_0EXNotificationBuilder.h>)

#import <ABI47_0_0EXNotifications/ABI47_0_0EXNotificationBuilder.h>
#import "ABI47_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXScopedNotificationBuilder : ABI47_0_0EXNotificationBuilder

- (instancetype)initWithScopeKey:(NSString *)scopeKey
                       andConstantsBinding:(ABI47_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END

#endif
