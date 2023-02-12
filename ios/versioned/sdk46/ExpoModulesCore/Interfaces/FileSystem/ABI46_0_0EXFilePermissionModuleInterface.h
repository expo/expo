// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXFileSystemInterface.h>

@protocol ABI46_0_0EXFilePermissionModuleInterface

- (ABI46_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

