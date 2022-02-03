// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXServerRegistrationModule.h>)

#import <EXNotifications/EXServerRegistrationModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedServerRegistrationModule : EXServerRegistrationModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END

#endif
