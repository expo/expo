// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI45_0_0EXSecureStore/ABI45_0_0EXSecureStore.h>)
#import <ABI45_0_0EXSecureStore/ABI45_0_0EXSecureStore.h>

#import "ABI45_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXScopedSecureStore : ABI45_0_0EXSecureStore

- (instancetype)initWithScopeKey:(NSString *)scopeKey
                       andConstantsBinding:(ABI45_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
