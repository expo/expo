// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXFileSystemInterface.h>

@protocol ABI44_0_0EXFilePermissionModuleInterface

- (ABI44_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

