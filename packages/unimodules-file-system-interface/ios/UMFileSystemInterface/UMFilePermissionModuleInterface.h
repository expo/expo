// Copyright 2018-present 650 Industries. All rights reserved.
#import <UMFileSystemInterface/UMFileSystemInterface.h>

@protocol UMFilePermissionModuleInterface

- (UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

