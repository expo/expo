// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXInternalModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXExportedModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0EXModuleRegistry : NSObject

- (instancetype)initWithInternalModules:(NSSet<id<ABI49_0_0EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<ABI49_0_0EXExportedModule *> *)exportedModules
                       singletonModules:(NSSet *)singletonModules;

- (void)registerInternalModule:(id<ABI49_0_0EXInternalModule>)internalModule;
- (void)registerExportedModule:(ABI49_0_0EXExportedModule *)exportedModule;

- (void)setDelegate:(id<ABI49_0_0EXModuleRegistryDelegate>)delegate;

// Call this method once all the modules are set up and registered in the registry.
- (void)initialize;

- (ABI49_0_0EXExportedModule *)getExportedModuleForName:(NSString *)name;
- (ABI49_0_0EXExportedModule *)getExportedModuleOfClass:(Class)moduleClass;
- (id)getModuleImplementingProtocol:(Protocol *)protocol;
- (id)getSingletonModuleForName:(NSString *)singletonModuleName;

- (NSArray<id<ABI49_0_0EXInternalModule>> *)getAllInternalModules;
- (NSArray<ABI49_0_0EXExportedModule *> *)getAllExportedModules;
- (NSArray *)getAllSingletonModules;

@end

NS_ASSUME_NONNULL_END
