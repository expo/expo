// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistry.h>

@interface ABI30_0_0EXModuleRegistryProvider : NSObject

@property (nonatomic, weak) id<ABI30_0_0EXModuleRegistryDelegate> moduleRegistryDelegate;

+ (NSSet *)singletonModules;

- (instancetype)initWithSingletonModules:(NSSet *)modules;
- (ABI30_0_0EXModuleRegistry *)moduleRegistryForExperienceId:(NSString *)experienceId;

@end
