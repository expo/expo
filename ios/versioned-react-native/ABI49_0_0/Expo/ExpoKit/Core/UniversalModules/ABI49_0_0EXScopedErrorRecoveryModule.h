// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI49_0_0EXErrorRecovery/ABI49_0_0EXErrorRecoveryModule.h>)
#import <ABI49_0_0EXErrorRecovery/ABI49_0_0EXErrorRecoveryModule.h>

@interface ABI49_0_0EXScopedErrorRecoveryModule : ABI49_0_0EXErrorRecoveryModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

#endif
