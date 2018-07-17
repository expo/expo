// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI29_0_0EXModuleRegistryBinding.h"

@implementation ABI29_0_0EXScopedModuleRegistry (ModuleRegistry)

- (ABI29_0_0EXModuleRegistry *)moduleRegistry
{
  return [[self.bridge moduleForClass:[ABI29_0_0EXModuleRegistryBinding class]] moduleRegistry];
}

@end

@interface ABI29_0_0EXModuleRegistryBinding ()

@property (nonatomic, weak) ABI29_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI29_0_0EXModuleRegistryBinding

- (instancetype)initWithModuleRegistry:(ABI29_0_0EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI29_0_0EXModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
