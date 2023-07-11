// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI49_0_0EXSecureStore/ABI49_0_0EXSecureStore.h>)
#import <ABI49_0_0EXSecureStore/ABI49_0_0EXSecureStore.h>

#import "ABI49_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0EXScopedSecureStore : ABI49_0_0EXSecureStore

- (instancetype)initWithScopeKey:(NSString *)scopeKey
                       andConstantsBinding:(ABI49_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
