// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EDUMInternalModule.h>
#import <EDUMExportedModule.h>
#import <EDUMViewManager.h>
#import <EDUMModuleRegistryDelegate.h>

@interface EDUMModuleRegistry : NSObject

- (instancetype)initWithInternalModules:(NSSet<id<EDUMInternalModule>> *)internalModules
                        exportedModules:(NSSet<EDUMExportedModule *> *)exportedModules
                           viewManagers:(NSSet<EDUMViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules;

- (void)registerInternalModule:(id<EDUMInternalModule>)internalModule;
- (void)registerExportedModule:(EDUMExportedModule *)exportedModule;
- (void)registerViewManager:(EDUMViewManager *)viewManager;

- (void)setDelegate:(id<EDUMModuleRegistryDelegate>)delegate;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (EDUMExportedModule *)getExportedModuleForName:(NSString *)name;
- (EDUMExportedModule *)getExportedModuleOfClass:(Class)moduleClass;
- (id)getModuleImplementingProtocol:(Protocol *)protocol;
- (id)getSingletonModuleForName:(NSString *)singletonModuleName;

- (NSArray<id<EDUMInternalModule>> *)getAllInternalModules;
- (NSArray<EDUMExportedModule *> *)getAllExportedModules;
- (NSArray<EDUMViewManager *> *)getAllViewManagers;
- (NSArray *)getAllSingletonModules;

@end
