// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistry.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXSingletonModule.h>

@interface ABI32_0_0EXModuleRegistryProvider : NSObject

@property (nonatomic, weak) id<ABI32_0_0EXModuleRegistryDelegate> moduleRegistryDelegate;

+ (NSSet *)singletonModules;
+ (nullable ABI32_0_0EXSingletonModule *)getSingletonModuleForClass:(Class)singletonClass;

- (instancetype)initWithSingletonModules:(NSSet *)modules;
- (ABI32_0_0EXModuleRegistry *)moduleRegistryForExperienceId:(NSString *)experienceId;

@end
