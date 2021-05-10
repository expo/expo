// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI41_0_0EXSecureStore/ABI41_0_0EXSecureStore.h>)
#import <ABI41_0_0EXSecureStore/ABI41_0_0EXSecureStore.h>

#import "ABI41_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXScopedSecureStore : ABI41_0_0EXSecureStore

- (instancetype)initWithExperienceId:(NSString *)experienceId
                 andConstantsBinding:(ABI41_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
