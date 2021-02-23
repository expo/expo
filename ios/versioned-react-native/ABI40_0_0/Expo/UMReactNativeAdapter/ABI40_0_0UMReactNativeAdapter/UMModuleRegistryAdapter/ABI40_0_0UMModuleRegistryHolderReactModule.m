// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMModuleRegistryHolderReactModule.h>

@interface ABI40_0_0UMModuleRegistryHolderReactModule ()

@property (nonatomic, weak) ABI40_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI40_0_0UMModuleRegistryHolderReactModule

- (instancetype)initWithModuleRegistry:(ABI40_0_0UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI40_0_0UMModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
