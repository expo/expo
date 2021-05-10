// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI39_0_0EXSecureStore/ABI39_0_0EXSecureStore.h>)
#import <ABI39_0_0EXSecureStore/ABI39_0_0EXSecureStore.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXScopedSecureStore : ABI39_0_0EXSecureStore

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
#endif
