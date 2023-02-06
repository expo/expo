// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistry.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(ModuleRegistryProvider)
@interface ABI48_0_0EXModuleRegistryProvider : NSObject

@property (nonatomic, weak) id<ABI48_0_0EXModuleRegistryDelegate> moduleRegistryDelegate;

+ (NSSet<Class> *)getModulesClasses;
+ (NSSet *)singletonModules;
+ (nullable ABI48_0_0EXSingletonModule *)getSingletonModuleForClass:(Class)singletonClass;

- (instancetype)init __deprecated_msg("Expo modules are now being automatically registered. You can remove this method call.");
- (instancetype)initWithSingletonModules:(NSSet *)modules;
- (ABI48_0_0EXModuleRegistry *)moduleRegistry;

@end

NS_ASSUME_NONNULL_END
