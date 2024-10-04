// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI42_0_0EXErrorRecovery/ABI42_0_0EXErrorRecoveryModule.h>)
#import <ABI42_0_0EXErrorRecovery/ABI42_0_0EXErrorRecoveryModule.h>

@interface ABI42_0_0EXScopedErrorRecoveryModule : ABI42_0_0EXErrorRecoveryModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

#endif
