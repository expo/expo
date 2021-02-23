// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistry.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0UMModuleRegistryProvider : NSObject

@property (nonatomic, weak) id<ABI40_0_0UMModuleRegistryDelegate> moduleRegistryDelegate;

+ (NSSet *)singletonModules;
+ (nullable ABI40_0_0UMSingletonModule *)getSingletonModuleForClass:(Class)singletonClass;

- (instancetype)initWithSingletonModules:(NSSet *)modules;
- (ABI40_0_0UMModuleRegistry *)moduleRegistry;

@end

NS_ASSUME_NONNULL_END
