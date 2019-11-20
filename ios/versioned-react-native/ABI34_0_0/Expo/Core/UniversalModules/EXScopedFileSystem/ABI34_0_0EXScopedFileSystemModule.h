// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI34_0_0EXFileSystem/ABI34_0_0EXFileSystem.h>)
#import <UIKit/UIKit.h>
#import <ABI34_0_0EXFileSystem/ABI34_0_0EXFileSystem.h>
#import "ABI34_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI34_0_0EXScopedFileSystemModule : ABI34_0_0EXFileSystem

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI34_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
