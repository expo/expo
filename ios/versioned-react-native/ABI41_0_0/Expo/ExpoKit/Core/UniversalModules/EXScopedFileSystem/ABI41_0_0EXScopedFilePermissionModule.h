// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI41_0_0EXFileSystem/ABI41_0_0EXFilePermissionModule.h>)
#import <ABI41_0_0EXFileSystem/ABI41_0_0EXFilePermissionModule.h>
#import "ABI41_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXScopedFilePermissionModule : ABI41_0_0EXFilePermissionModule

- (instancetype)initWithConstantsBinding:(ABI41_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
