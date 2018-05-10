// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXExportedModule.h>
#import <EXCore/EXViewManager.h>

@interface EXModuleRegistry : NSObject

@property (nonatomic, readonly) NSString *experienceId;

- (instancetype)initWithInternalModules:(NSSet<id<EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<EXExportedModule *> *)exportedModules
                           viewManagers:(NSSet<EXViewManager *> *)viewManagers;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (id<EXInternalModule>)getExportedModuleForName:(NSString *)name;
- (id)getModuleForName:(NSString *)name downcastedTo:(Protocol *)protocol exception:(NSException * __autoreleasing *)outException;

- (NSArray<id<EXInternalModule>> *)getAllInternalModules;
- (NSArray<EXExportedModule *> *)getAllExportedModules;
- (NSArray<EXViewManager *> *)getAllViewManagers;

@end
