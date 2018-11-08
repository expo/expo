// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistry.h>

@interface ABI31_0_0EXModuleRegistryProvider : NSObject

@property (nonatomic, weak) id<ABI31_0_0EXModuleRegistryDelegate> moduleRegistryDelegate;

+ (NSSet *)singletonModules;

- (instancetype)initWithSingletonModules:(NSSet *)modules;
- (ABI31_0_0EXModuleRegistry *)moduleRegistryForExperienceId:(NSString *)experienceId;

@end
