// Copyright 2018-present 650 Industries. All rights reserved.
@protocol UMFilePermissionModuleInterface

- (UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs;

@end

