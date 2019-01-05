// Copyright 2018-present 650 Industries. All rights reserved.
@protocol EXFilePermissionModuleInterface

- (EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs;

@end

