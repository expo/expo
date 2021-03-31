// Copyright 2018-present 650 Industries. All rights reserved.
#import <ABI41_0_0UMFileSystemInterface/ABI41_0_0UMFileSystemInterface.h>

@protocol ABI41_0_0UMFilePermissionModuleInterface

- (ABI41_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

