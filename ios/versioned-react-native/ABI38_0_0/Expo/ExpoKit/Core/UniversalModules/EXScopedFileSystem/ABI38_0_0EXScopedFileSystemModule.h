// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI38_0_0EXFileSystem/ABI38_0_0EXFileSystem.h>)
#import <UIKit/UIKit.h>
#import <ABI38_0_0EXFileSystem/ABI38_0_0EXFileSystem.h>
#import "ABI38_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI38_0_0EXScopedFileSystemModule : ABI38_0_0EXFileSystem

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI38_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
