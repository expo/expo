// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI48_0_0EXSecureStore/ABI48_0_0EXSecureStore.h>)
#import <ABI48_0_0EXSecureStore/ABI48_0_0EXSecureStore.h>

#import "ABI48_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXScopedSecureStore : ABI48_0_0EXSecureStore

- (instancetype)initWithScopeKey:(NSString *)scopeKey
                       andConstantsBinding:(ABI48_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
