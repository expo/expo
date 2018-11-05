// Copyright © 2018 650 Industries. All rights reserved.

#import "EXModuleRegistryBinding.h"

@implementation EXScopedModuleRegistry (ModuleRegistry)

- (EXModuleRegistry *)moduleRegistry
{
  return [[self.bridge moduleForClass:[EXModuleRegistryBinding class]] moduleRegistry];
}

@end

@interface EXModuleRegistryBinding ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXModuleRegistryBinding

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (EXModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
