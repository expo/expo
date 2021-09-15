// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistryHolderReactModule.h>

@interface EXModuleRegistryHolderReactModule ()

@property (nonatomic, weak) EXModuleRegistry *exModuleRegistry;

@end

@implementation EXModuleRegistryHolderReactModule

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _exModuleRegistry = moduleRegistry;
  }
  return self;
}

- (EXModuleRegistry *)exModuleRegistry
{
  return _exModuleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
