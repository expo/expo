// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXInternalModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXViewManager.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXModuleRegistry : NSObject

- (instancetype)initWithInternalModules:(NSSet<id<ABI45_0_0EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<ABI45_0_0EXExportedModule *> *)exportedModules
                           viewManagers:(NSSet<ABI45_0_0EXViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules;

- (void)registerInternalModule:(id<ABI45_0_0EXInternalModule>)internalModule;
- (void)registerExportedModule:(ABI45_0_0EXExportedModule *)exportedModule;
- (void)registerViewManager:(ABI45_0_0EXViewManager *)viewManager;

- (void)setDelegate:(id<ABI45_0_0EXModuleRegistryDelegate>)delegate;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (ABI45_0_0EXExportedModule *)getExportedModuleForName:(NSString *)name;
- (ABI45_0_0EXExportedModule *)getExportedModuleOfClass:(Class)moduleClass;
- (id)getModuleImplementingProtocol:(Protocol *)protocol;
- (id)getSingletonModuleForName:(NSString *)singletonModuleName;

- (NSArray<id<ABI45_0_0EXInternalModule>> *)getAllInternalModules;
- (NSArray<ABI45_0_0EXExportedModule *> *)getAllExportedModules;
- (NSArray<ABI45_0_0EXViewManager *> *)getAllViewManagers;
- (NSArray *)getAllSingletonModules;

@end

NS_ASSUME_NONNULL_END
