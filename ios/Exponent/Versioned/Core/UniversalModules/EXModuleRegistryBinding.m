// Copyright © 2018 650 Industries. All rights reserved.

#import "EXModuleRegistryBinding.h"

@implementation EXScopedModuleRegistry (ModuleRegistry)

- (UMModuleRegistry *)moduleRegistry
{
  return [[self.bridge moduleForClass:[EXModuleRegistryBinding class]] moduleRegistry];
}

@end

@interface EXModuleRegistryBinding ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXModuleRegistryBinding

- (instancetype)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (UMModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
