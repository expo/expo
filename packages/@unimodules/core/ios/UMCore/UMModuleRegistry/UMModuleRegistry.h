// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMExportedModule.h>
#import <UMCore/UMViewManager.h>
#import <UMCore/UMModuleRegistryDelegate.h>

@interface UMModuleRegistry : NSObject

- (instancetype)initWithInternalModules:(NSSet<id<UMInternalModule>> *)internalModules
                        exportedModules:(NSSet<UMExportedModule *> *)exportedModules
                           viewManagers:(NSSet<UMViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules;

- (void)registerInternalModule:(id<UMInternalModule>)internalModule;
- (void)registerExportedModule:(UMExportedModule *)exportedModule;
- (void)registerViewManager:(UMViewManager *)viewManager;

- (void)setDelegate:(id<UMModuleRegistryDelegate>)delegate;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (UMExportedModule *)getExportedModuleForName:(NSString *)name;
- (UMExportedModule *)getExportedModuleOfClass:(Class)moduleClass;
- (id)getModuleImplementingProtocol:(Protocol *)protocol;
- (id)getSingletonModuleForName:(NSString *)singletonModuleName;

- (NSArray<id<UMInternalModule>> *)getAllInternalModules;
- (NSArray<UMExportedModule *> *)getAllExportedModules;
- (NSArray<UMViewManager *> *)getAllViewManagers;
- (NSArray *)getAllSingletonModules;

@end
