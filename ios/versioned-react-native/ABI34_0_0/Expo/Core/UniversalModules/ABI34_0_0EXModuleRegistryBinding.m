// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI34_0_0EXModuleRegistryBinding.h"

@implementation ABI34_0_0EXScopedModuleRegistry (ModuleRegistry)

- (ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  return [[self.bridge moduleForClass:[ABI34_0_0EXModuleRegistryBinding class]] moduleRegistry];
}

@end

@interface ABI34_0_0EXModuleRegistryBinding ()

@property (nonatomic, weak) ABI34_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI34_0_0EXModuleRegistryBinding

- (instancetype)initWithModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
