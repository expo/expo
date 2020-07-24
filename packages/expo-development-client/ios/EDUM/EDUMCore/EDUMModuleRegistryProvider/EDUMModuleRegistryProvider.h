// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EDUMModuleRegistry.h>
#import <EDUMSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EDUMModuleRegistryProvider : NSObject

@property (nonatomic, weak) id<EDUMModuleRegistryDelegate> moduleRegistryDelegate;

+ (NSSet *)singletonModules;
+ (nullable EDUMSingletonModule *)getSingletonModuleForClass:(Class)singletonClass;

- (instancetype)initWithSingletonModules:(NSSet *)modules;
- (EDUMModuleRegistry *)moduleRegistry;

@end

NS_ASSUME_NONNULL_END
