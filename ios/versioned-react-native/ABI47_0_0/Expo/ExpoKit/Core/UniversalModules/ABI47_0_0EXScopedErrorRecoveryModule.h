// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI47_0_0EXErrorRecovery/ABI47_0_0EXErrorRecoveryModule.h>)
#import <ABI47_0_0EXErrorRecovery/ABI47_0_0EXErrorRecoveryModule.h>

@interface ABI47_0_0EXScopedErrorRecoveryModule : ABI47_0_0EXErrorRecoveryModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

#endif
