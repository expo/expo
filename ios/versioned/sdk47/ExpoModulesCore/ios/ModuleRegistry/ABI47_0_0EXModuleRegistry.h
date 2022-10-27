// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXInternalModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXViewManager.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXModuleRegistry : NSObject

- (instancetype)initWithInternalModules:(NSSet<id<ABI47_0_0EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<ABI47_0_0EXExportedModule *> *)exportedModules
                           viewManagers:(NSSet<ABI47_0_0EXViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules;

- (void)registerInternalModule:(id<ABI47_0_0EXInternalModule>)internalModule;
- (void)registerExportedModule:(ABI47_0_0EXExportedModule *)exportedModule;
- (void)registerViewManager:(ABI47_0_0EXViewManager *)viewManager;

- (void)setDelegate:(id<ABI47_0_0EXModuleRegistryDelegate>)delegate;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (ABI47_0_0EXExportedModule *)getExportedModuleForName:(NSString *)name;
- (ABI47_0_0EXExportedModule *)getExportedModuleOfClass:(Class)moduleClass;
- (id)getModuleImplementingProtocol:(Protocol *)protocol;
- (id)getSingletonModuleForName:(NSString *)singletonModuleName;

- (NSArray<id<ABI47_0_0EXInternalModule>> *)getAllInternalModules;
- (NSArray<ABI47_0_0EXExportedModule *> *)getAllExportedModules;
- (NSArray<ABI47_0_0EXViewManager *> *)getAllViewManagers;
- (NSArray *)getAllSingletonModules;

@end

NS_ASSUME_NONNULL_END
