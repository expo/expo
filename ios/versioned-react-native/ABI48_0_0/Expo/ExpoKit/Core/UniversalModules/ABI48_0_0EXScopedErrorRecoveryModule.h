// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI48_0_0EXErrorRecovery/ABI48_0_0EXErrorRecoveryModule.h>)
#import <ABI48_0_0EXErrorRecovery/ABI48_0_0EXErrorRecoveryModule.h>

@interface ABI48_0_0EXScopedErrorRecoveryModule : ABI48_0_0EXErrorRecoveryModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

#endif
