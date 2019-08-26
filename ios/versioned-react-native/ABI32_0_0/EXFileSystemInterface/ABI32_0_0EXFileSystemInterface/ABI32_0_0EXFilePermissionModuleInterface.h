// Copyright 2018-present 650 Industries. All rights reserved.
@protocol ABI32_0_0EXFilePermissionModuleInterface

- (ABI32_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs;

@end

