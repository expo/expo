// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI39_0_0EXFirebaseCore/ABI39_0_0EXFirebaseCore.h>)
#import <UIKit/UIKit.h>
#import <ABI39_0_0EXFirebaseCore/ABI39_0_0EXFirebaseCore.h>
#import "ABI39_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXScopedFirebaseCore : ABI39_0_0EXFirebaseCore

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI39_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
