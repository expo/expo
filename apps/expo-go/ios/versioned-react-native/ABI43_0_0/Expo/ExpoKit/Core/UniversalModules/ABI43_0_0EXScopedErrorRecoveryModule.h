// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI43_0_0EXErrorRecovery/ABI43_0_0EXErrorRecoveryModule.h>)
#import <ABI43_0_0EXErrorRecovery/ABI43_0_0EXErrorRecoveryModule.h>

@interface ABI43_0_0EXScopedErrorRecoveryModule : ABI43_0_0EXErrorRecoveryModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

#endif
