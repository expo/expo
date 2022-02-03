// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXInternalModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXViewManager.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXModuleRegistry : NSObject

- (instancetype)initWithInternalModules:(NSSet<id<ABI44_0_0EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<ABI44_0_0EXExportedModule *> *)exportedModules
                           viewManagers:(NSSet<ABI44_0_0EXViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules;

- (void)registerInternalModule:(id<ABI44_0_0EXInternalModule>)internalModule;
- (void)registerExportedModule:(ABI44_0_0EXExportedModule *)exportedModule;
- (void)registerViewManager:(ABI44_0_0EXViewManager *)viewManager;

- (void)setDelegate:(id<ABI44_0_0EXModuleRegistryDelegate>)delegate;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (ABI44_0_0EXExportedModule *)getExportedModuleForName:(NSString *)name;
- (ABI44_0_0EXExportedModule *)getExportedModuleOfClass:(Class)moduleClass;
- (id)getModuleImplementingProtocol:(Protocol *)protocol;
- (id)getSingletonModuleForName:(NSString *)singletonModuleName;

- (NSArray<id<ABI44_0_0EXInternalModule>> *)getAllInternalModules;
- (NSArray<ABI44_0_0EXExportedModule *> *)getAllExportedModules;
- (NSArray<ABI44_0_0EXViewManager *> *)getAllViewManagers;
- (NSArray *)getAllSingletonModules;

@end

NS_ASSUME_NONNULL_END
