// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI41_0_0EXNotifications/ABI41_0_0EXServerRegistrationModule.h>)

#import <ABI41_0_0EXNotifications/ABI41_0_0EXServerRegistrationModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXScopedServerRegistrationModule : ABI41_0_0EXServerRegistrationModule

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

#endif
