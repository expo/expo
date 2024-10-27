// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXSecureStore/EXSecureStore.h>)
#import <EXSecureStore/EXSecureStore.h>

#import "EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedSecureStore : EXSecureStore

- (instancetype)initWithScopeKey:(NSString *)scopeKey
                       andConstantsBinding:(EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
