// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXDefines.h>

@class EXModuleRegistry;

@protocol EXModule <NSObject>

- (instancetype)init;
+ (const NSString *)moduleName;
+ (const NSString *)internalModuleName;

@optional

- (instancetype)initWithExperienceId:(NSString *)experienceId;
- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry;

@end
