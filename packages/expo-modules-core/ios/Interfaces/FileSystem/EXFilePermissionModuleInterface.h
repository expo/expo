// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXFileSystemInterface.h>

@protocol EXFilePermissionModuleInterface

- (EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

