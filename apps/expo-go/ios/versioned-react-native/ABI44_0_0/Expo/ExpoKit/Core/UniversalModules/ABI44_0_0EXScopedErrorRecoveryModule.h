// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI44_0_0EXErrorRecovery/ABI44_0_0EXErrorRecoveryModule.h>)
#import <ABI44_0_0EXErrorRecovery/ABI44_0_0EXErrorRecoveryModule.h>

@interface ABI44_0_0EXScopedErrorRecoveryModule : ABI44_0_0EXErrorRecoveryModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

#endif
