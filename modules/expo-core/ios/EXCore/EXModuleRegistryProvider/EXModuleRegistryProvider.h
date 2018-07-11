// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXModuleRegistry.h>

@interface EXModuleRegistryProvider : NSObject

@property (nonatomic, weak) id<EXModuleRegistryDelegate> moduleRegistryDelegate;

- (instancetype)initWithSingletonModuleClasses:(NSSet *)moduleClasses;
- (EXModuleRegistry *)moduleRegistryForExperienceId:(NSString *)experienceId;

@end
