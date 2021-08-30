// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXViewManager.h>
#import <ExpoModulesCore/EXModuleRegistryDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXModuleRegistry : NSObject

- (instancetype)initWithInternalModules:(NSSet<id<EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<EXExportedModule *> *)exportedModules
                           viewManagers:(NSSet<EXViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules;

- (void)registerInternalModule:(id<EXInternalModule>)internalModule;
- (void)registerExportedModule:(EXExportedModule *)exportedModule;
- (void)registerViewManager:(EXViewManager *)viewManager;

- (void)setDelegate:(id<EXModuleRegistryDelegate>)delegate;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (EXExportedModule *)getExportedModuleForName:(NSString *)name;
- (EXExportedModule *)getExportedModuleOfClass:(Class)moduleClass;
- (id)getModuleImplementingProtocol:(Protocol *)protocol;
- (id)getSingletonModuleForName:(NSString *)singletonModuleName;

- (NSArray<id<EXInternalModule>> *)getAllInternalModules;
- (NSArray<EXExportedModule *> *)getAllExportedModules;
- (NSArray<EXViewManager *> *)getAllViewManagers;
- (NSArray *)getAllSingletonModules;

@end

NS_ASSUME_NONNULL_END
