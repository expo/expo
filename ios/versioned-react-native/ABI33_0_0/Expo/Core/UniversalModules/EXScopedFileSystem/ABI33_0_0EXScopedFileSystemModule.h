// Copyright 2015-present 650 Industries. All rights reserved.
#import <UIKit/UIKit.h>
#import <ABI33_0_0EXFileSystem/ABI33_0_0EXFileSystem.h>
#import "ABI33_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI33_0_0EXScopedFileSystemModule : ABI33_0_0EXFileSystem

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI33_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
