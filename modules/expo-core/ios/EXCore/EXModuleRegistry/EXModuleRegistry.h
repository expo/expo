// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXExportedModule.h>
#import <EXCore/EXViewManager.h>
#import <EXCore/EXSingletonModule.h>
#import <EXCore/EXModuleRegistryDelegate.h>

@interface EXModuleRegistry : NSObject

@property (nonatomic, readonly) NSString *experienceId;

- (instancetype)initWithInternalModules:(NSSet<id<EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<EXExportedModule *> *)exportedModules
                           viewManagers:(NSSet<EXViewManager *> *)viewManagers
                       singletonModules:(NSSet<EXSingletonModule *> *)singletonModules;

- (void)registerInternalModule:(id<EXInternalModule>)internalModule;
- (void)registerExportedModule:(EXExportedModule *)exportedModule;
- (void)registerViewManager:(EXViewManager *)viewManager;

- (void)setDelegate:(id<EXModuleRegistryDelegate>)delegate;

- (id<EXInternalModule>)unregisterInternalModuleForProtocol:(Protocol *)protocol;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (EXExportedModule *)getExportedModuleForName:(NSString *)name;
- (EXExportedModule *)getExportedModuleOfClass:(Class)moduleClass;
- (id)getModuleImplementingProtocol:(Protocol *)protocol;
- (EXSingletonModule *)getSingletonModuleForName:(NSString *)singletonModuleName;

- (NSArray<id<EXInternalModule>> *)getAllInternalModules;
- (NSArray<EXExportedModule *> *)getAllExportedModules;
- (NSArray<EXViewManager *> *)getAllViewManagers;
- (NSArray<EXSingletonModule *> *)getAllSingletonModules;

@end
