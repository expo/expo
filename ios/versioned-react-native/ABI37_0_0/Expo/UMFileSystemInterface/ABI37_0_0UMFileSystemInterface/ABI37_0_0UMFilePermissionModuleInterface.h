// Copyright 2018-present 650 Industries. All rights reserved.
#import <ABI37_0_0UMFileSystemInterface/ABI37_0_0UMFileSystemInterface.h>

@protocol ABI37_0_0UMFilePermissionModuleInterface

- (ABI37_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

