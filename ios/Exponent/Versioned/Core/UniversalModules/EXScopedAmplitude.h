// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXAmplitude/EXAmplitude.h>)
#import <EXAmplitude/EXAmplitude.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedAmplitude : EXAmplitude

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
#endif
