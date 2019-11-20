// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI36_0_0EXModuleRegistryBinding.h"

@implementation ABI36_0_0EXScopedModuleRegistry (ModuleRegistry)

- (ABI36_0_0UMModuleRegistry *)moduleRegistry
{
  return [[self.bridge moduleForClass:[ABI36_0_0EXModuleRegistryBinding class]] moduleRegistry];
}

@end

@interface ABI36_0_0EXModuleRegistryBinding ()

@property (nonatomic, weak) ABI36_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI36_0_0EXModuleRegistryBinding

- (instancetype)initWithModuleRegistry:(ABI36_0_0UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI36_0_0UMModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
