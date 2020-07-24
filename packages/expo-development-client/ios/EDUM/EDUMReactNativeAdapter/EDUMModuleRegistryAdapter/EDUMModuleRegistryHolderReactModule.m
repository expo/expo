// Copyright 2018-present 650 Industries. All rights reserved.

#import <EDUMModuleRegistryHolderReactModule.h>

@interface EDUMModuleRegistryHolderReactModule ()

@property (nonatomic, weak) EDUMModuleRegistry *moduleRegistry;

@end

@implementation EDUMModuleRegistryHolderReactModule

- (instancetype)initWithModuleRegistry:(EDUMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (EDUMModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
