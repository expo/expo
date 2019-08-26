// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI31_0_0EXModuleRegistryBinding.h"

@implementation ABI31_0_0EXScopedModuleRegistry (ModuleRegistry)

- (ABI31_0_0EXModuleRegistry *)moduleRegistry
{
  return [[self.bridge moduleForClass:[ABI31_0_0EXModuleRegistryBinding class]] moduleRegistry];
}

@end

@interface ABI31_0_0EXModuleRegistryBinding ()

@property (nonatomic, weak) ABI31_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI31_0_0EXModuleRegistryBinding

- (instancetype)initWithModuleRegistry:(ABI31_0_0EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI31_0_0EXModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
