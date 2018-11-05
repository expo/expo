// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXInternalModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXExportedModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXViewManager.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryDelegate.h>

@interface ABI30_0_0EXModuleRegistry : NSObject

@property (nonatomic, readonly) NSString *experienceId;

- (instancetype)initWithInternalModules:(NSSet<id<ABI30_0_0EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<ABI30_0_0EXExportedModule *> *)exportedModules
                           viewManagers:(NSSet<ABI30_0_0EXViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules;

- (void)registerInternalModule:(id<ABI30_0_0EXInternalModule>)internalModule;
- (void)registerExportedModule:(ABI30_0_0EXExportedModule *)exportedModule;
- (void)registerViewManager:(ABI30_0_0EXViewManager *)viewManager;

- (void)setDelegate:(id<ABI30_0_0EXModuleRegistryDelegate>)delegate;

- (id<ABI30_0_0EXInternalModule>)unregisterInternalModuleForProtocol:(Protocol *)protocol;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (ABI30_0_0EXExportedModule *)getExportedModuleForName:(NSString *)name;
- (ABI30_0_0EXExportedModule *)getExportedModuleOfClass:(Class)moduleClass;
- (id)getModuleImplementingProtocol:(Protocol *)protocol;
- (id)getSingletonModuleForName:(NSString *)singletonModuleName;

- (NSArray<id<ABI30_0_0EXInternalModule>> *)getAllInternalModules;
- (NSArray<ABI30_0_0EXExportedModule *> *)getAllExportedModules;
- (NSArray<ABI30_0_0EXViewManager *> *)getAllViewManagers;
- (NSArray *)getAllSingletonModules;

@end
