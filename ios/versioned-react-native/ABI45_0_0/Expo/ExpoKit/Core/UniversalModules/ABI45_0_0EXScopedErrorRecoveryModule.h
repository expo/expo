// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI45_0_0EXErrorRecovery/ABI45_0_0EXErrorRecoveryModule.h>)
#import <ABI45_0_0EXErrorRecovery/ABI45_0_0EXErrorRecoveryModule.h>

@interface ABI45_0_0EXScopedErrorRecoveryModule : ABI45_0_0EXErrorRecoveryModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

#endif
