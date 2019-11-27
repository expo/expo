// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMInternalModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMViewManager.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryDelegate.h>

@interface ABI36_0_0UMModuleRegistry : NSObject

- (instancetype)initWithInternalModules:(NSSet<id<ABI36_0_0UMInternalModule>> *)internalModules
                        exportedModules:(NSSet<ABI36_0_0UMExportedModule *> *)exportedModules
                           viewManagers:(NSSet<ABI36_0_0UMViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules;

- (void)registerInternalModule:(id<ABI36_0_0UMInternalModule>)internalModule;
- (void)registerExportedModule:(ABI36_0_0UMExportedModule *)exportedModule;
- (void)registerViewManager:(ABI36_0_0UMViewManager *)viewManager;

- (void)setDelegate:(id<ABI36_0_0UMModuleRegistryDelegate>)delegate;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (ABI36_0_0UMExportedModule *)getExportedModuleForName:(NSString *)name;
- (ABI36_0_0UMExportedModule *)getExportedModuleOfClass:(Class)moduleClass;
- (id)getModuleImplementingProtocol:(Protocol *)protocol;
- (id)getSingletonModuleForName:(NSString *)singletonModuleName;

- (NSArray<id<ABI36_0_0UMInternalModule>> *)getAllInternalModules;
- (NSArray<ABI36_0_0UMExportedModule *> *)getAllExportedModules;
- (NSArray<ABI36_0_0UMViewManager *> *)getAllViewManagers;
- (NSArray *)getAllSingletonModules;

@end
