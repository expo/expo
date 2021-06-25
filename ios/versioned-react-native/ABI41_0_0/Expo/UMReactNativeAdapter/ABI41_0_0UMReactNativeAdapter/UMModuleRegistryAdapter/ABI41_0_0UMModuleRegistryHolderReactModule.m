// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0UMModuleRegistryHolderReactModule.h>

@interface ABI41_0_0UMModuleRegistryHolderReactModule ()

@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *umModuleRegistry;

@end

@implementation ABI41_0_0UMModuleRegistryHolderReactModule

- (instancetype)initWithModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _umModuleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI41_0_0UMModuleRegistry *)umModuleRegistry
{
  return _umModuleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
