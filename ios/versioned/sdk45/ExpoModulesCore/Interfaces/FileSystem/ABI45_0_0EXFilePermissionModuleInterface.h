// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXFileSystemInterface.h>

@protocol ABI45_0_0EXFilePermissionModuleInterface

- (ABI45_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

