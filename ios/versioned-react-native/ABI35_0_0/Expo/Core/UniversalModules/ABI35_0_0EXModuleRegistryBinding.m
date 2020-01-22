// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI35_0_0EXModuleRegistryBinding.h"

@implementation ABI35_0_0EXScopedModuleRegistry (ModuleRegistry)

- (ABI35_0_0UMModuleRegistry *)moduleRegistry
{
  return [[self.bridge moduleForClass:[ABI35_0_0EXModuleRegistryBinding class]] moduleRegistry];
}

@end

@interface ABI35_0_0EXModuleRegistryBinding ()

@property (nonatomic, weak) ABI35_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI35_0_0EXModuleRegistryBinding

- (instancetype)initWithModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI35_0_0UMModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
