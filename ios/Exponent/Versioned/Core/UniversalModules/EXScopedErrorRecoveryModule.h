// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXErrorRecovery/EXErrorRecoveryModule.h>)
#import <EXErrorRecovery/EXErrorRecoveryModule.h>

@interface EXScopedErrorRecoveryModule : EXErrorRecoveryModule

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

#endif
