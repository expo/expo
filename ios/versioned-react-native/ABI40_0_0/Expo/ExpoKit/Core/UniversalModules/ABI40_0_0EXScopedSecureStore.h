// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI40_0_0EXSecureStore/ABI40_0_0EXSecureStore.h>)
#import <ABI40_0_0EXSecureStore/ABI40_0_0EXSecureStore.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXScopedSecureStore : ABI40_0_0EXSecureStore

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
#endif
