// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFileSystemInterface.h>

@protocol ABI42_0_0EXFilePermissionModuleInterface

- (ABI42_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

