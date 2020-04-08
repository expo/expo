// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMInternalModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMViewManager.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryDelegate.h>

@interface ABI37_0_0UMModuleRegistry : NSObject

- (instancetype)initWithInternalModules:(NSSet<id<ABI37_0_0UMInternalModule>> *)internalModules
                        exportedModules:(NSSet<ABI37_0_0UMExportedModule *> *)exportedModules
                           viewManagers:(NSSet<ABI37_0_0UMViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules;

- (void)registerInternalModule:(id<ABI37_0_0UMInternalModule>)internalModule;
- (void)registerExportedModule:(ABI37_0_0UMExportedModule *)exportedModule;
- (void)registerViewManager:(ABI37_0_0UMViewManager *)viewManager;

- (void)setDelegate:(id<ABI37_0_0UMModuleRegistryDelegate>)delegate;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (ABI37_0_0UMExportedModule *)getExportedModuleForName:(NSString *)name;
- (ABI37_0_0UMExportedModule *)getExportedModuleOfClass:(Class)moduleClass;
- (id)getModuleImplementingProtocol:(Protocol *)protocol;
- (id)getSingletonModuleForName:(NSString *)singletonModuleName;

- (NSArray<id<ABI37_0_0UMInternalModule>> *)getAllInternalModules;
- (NSArray<ABI37_0_0UMExportedModule *> *)getAllExportedModules;
- (NSArray<ABI37_0_0UMViewManager *> *)getAllViewManagers;
- (NSArray *)getAllSingletonModules;

@end
