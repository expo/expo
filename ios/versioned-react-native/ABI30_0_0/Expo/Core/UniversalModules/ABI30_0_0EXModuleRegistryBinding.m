// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI30_0_0EXModuleRegistryBinding.h"

@implementation ABI30_0_0EXScopedModuleRegistry (ModuleRegistry)

- (ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  return [[self.bridge moduleForClass:[ABI30_0_0EXModuleRegistryBinding class]] moduleRegistry];
}

@end

@interface ABI30_0_0EXModuleRegistryBinding ()

@property (nonatomic, weak) ABI30_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI30_0_0EXModuleRegistryBinding

- (instancetype)initWithModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
