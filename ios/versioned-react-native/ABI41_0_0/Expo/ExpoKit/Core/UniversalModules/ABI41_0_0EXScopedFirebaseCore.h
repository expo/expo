// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI41_0_0EXFirebaseCore/ABI41_0_0EXFirebaseCore.h>)
#import <UIKit/UIKit.h>
#import <ABI41_0_0EXFirebaseCore/ABI41_0_0EXFirebaseCore.h>
#import "ABI41_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXScopedFirebaseCore : ABI41_0_0EXFirebaseCore

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI41_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
