// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXModuleRegistry.h>

@interface EXModuleRegistryProvider : NSObject

- (EXModuleRegistry *)moduleRegistryForExperienceId:(NSString *)experienceId;

@end
