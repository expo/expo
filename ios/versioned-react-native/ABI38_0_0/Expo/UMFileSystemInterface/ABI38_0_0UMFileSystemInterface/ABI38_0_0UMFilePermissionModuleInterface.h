// Copyright 2018-present 650 Industries. All rights reserved.
#import <ABI38_0_0UMFileSystemInterface/ABI38_0_0UMFileSystemInterface.h>

@protocol ABI38_0_0UMFilePermissionModuleInterface

- (ABI38_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

