// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXFileSystemInterface.h>

@protocol ABI49_0_0EXFilePermissionModuleInterface

- (ABI49_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

