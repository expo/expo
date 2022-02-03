// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXFileSystemInterface.h>

@protocol ABI43_0_0EXFilePermissionModuleInterface

- (ABI43_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

