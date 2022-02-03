// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXNotificationPresentationModule.h>)

#import <EXNotifications/EXNotificationPresentationModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedNotificationPresentationModule : EXNotificationPresentationModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END

#endif
