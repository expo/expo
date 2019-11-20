// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI36_0_0EXFileSystem/ABI36_0_0EXFilePermissionModule.h>)
#import <ABI36_0_0EXFileSystem/ABI36_0_0EXFilePermissionModule.h>
#import "ABI36_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI36_0_0EXScopedFilePermissionModule : ABI36_0_0EXFilePermissionModule

- (instancetype)initWithConstantsBinding:(ABI36_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
