// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI33_0_0EXModuleRegistryBinding.h"

@implementation ABI33_0_0EXScopedModuleRegistry (ModuleRegistry)

- (ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  return [[self.bridge moduleForClass:[ABI33_0_0EXModuleRegistryBinding class]] moduleRegistry];
}

@end

@interface ABI33_0_0EXModuleRegistryBinding ()

@property (nonatomic, weak) ABI33_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI33_0_0EXModuleRegistryBinding

- (instancetype)initWithModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
