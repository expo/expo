#ifndef FilePermissionWielderInterface_h
#define FilePermissionWielderInterface_h

@protocol EXFilePermissionModuleInterface

- (EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs
                                  bundleDirectory:(NSString *)bundleDirectory;

@end

#endif /* FilePermissionWielderInterface_h */
