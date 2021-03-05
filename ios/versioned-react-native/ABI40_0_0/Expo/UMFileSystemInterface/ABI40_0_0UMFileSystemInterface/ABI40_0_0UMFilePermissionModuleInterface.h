// Copyright 2018-present 650 Industries. All rights reserved.
#import <ABI40_0_0UMFileSystemInterface/ABI40_0_0UMFileSystemInterface.h>

@protocol ABI40_0_0UMFilePermissionModuleInterface

- (ABI40_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

