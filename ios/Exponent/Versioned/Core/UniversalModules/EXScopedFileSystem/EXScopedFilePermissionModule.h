// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<EXFileSystem/EXFilePermissionModule.h>)
#import <EXFileSystem/EXFilePermissionModule.h>
#import "EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedFilePermissionModule : EXFilePermissionModule

- (instancetype)initWithConstantsBinding:(EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
