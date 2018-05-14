// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXModule.h>

@interface EXModuleRegistry : NSObject

@property (nonatomic, readonly) NSString *experienceId;

- (instancetype)initWithExperienceId:(NSString *)experienceId;

- (id<EXModule>)getExportedModuleForName:(NSString *)name;
- (id)getModuleForName:(NSString *)name downcastedTo:(Protocol *)protocol exception:(NSException * __autoreleasing *)outException;
- (id)createModuleForName:(NSString *)name downcastedTo:(Protocol *)protocol exception:(NSException * __autoreleasing *)outException;

- (NSArray<id<EXModule>> *)getAllModules;

@end
