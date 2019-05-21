// Copyright 2015-present 650 Industries. All rights reserved.
#import <ABI33_0_0EXFileSystem/ABI33_0_0EXFilePermissionModule.h>
#import "ABI33_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI33_0_0EXScopedFilePermissionModule : ABI33_0_0EXFilePermissionModule

- (instancetype)initWithConstantsBinding:(ABI33_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
