// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMModuleRegistry.h>
#import <UMCore/UMSingletonModule.h>

@interface UMModuleRegistryProvider : NSObject

@property (nonatomic, weak) id<UMModuleRegistryDelegate> moduleRegistryDelegate;

+ (NSSet *)singletonModules;
+ (nullable UMSingletonModule *)getSingletonModuleForClass:(Class)singletonClass;

- (instancetype)initWithSingletonModules:(NSSet *)modules;
- (UMModuleRegistry *)moduleRegistryForExperienceId:(NSString *)experienceId;

@end
