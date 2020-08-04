// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI38_0_0EXFirebaseCore/ABI38_0_0EXFirebaseCore.h>)
#import <UIKit/UIKit.h>
#import <ABI38_0_0EXFirebaseCore/ABI38_0_0EXFirebaseCore.h>
#import "ABI38_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI38_0_0EXScopedFirebaseCore : ABI38_0_0EXFirebaseCore

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI38_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
