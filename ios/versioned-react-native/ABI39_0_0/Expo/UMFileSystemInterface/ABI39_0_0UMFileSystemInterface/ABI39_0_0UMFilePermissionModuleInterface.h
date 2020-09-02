// Copyright 2018-present 650 Industries. All rights reserved.
#import <ABI39_0_0UMFileSystemInterface/ABI39_0_0UMFileSystemInterface.h>

@protocol ABI39_0_0UMFilePermissionModuleInterface

- (ABI39_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

