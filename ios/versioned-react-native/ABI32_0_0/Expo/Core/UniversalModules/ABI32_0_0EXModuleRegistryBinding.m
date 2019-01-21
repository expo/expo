// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI32_0_0EXModuleRegistryBinding.h"

@implementation ABI32_0_0EXScopedModuleRegistry (ModuleRegistry)

- (ABI32_0_0EXModuleRegistry *)moduleRegistry
{
  return [[self.bridge moduleForClass:[ABI32_0_0EXModuleRegistryBinding class]] moduleRegistry];
}

@end

@interface ABI32_0_0EXModuleRegistryBinding ()

@property (nonatomic, weak) ABI32_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI32_0_0EXModuleRegistryBinding

- (instancetype)initWithModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI32_0_0EXModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
