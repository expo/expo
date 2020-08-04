// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMReactNativeAdapter/ABI38_0_0UMModuleRegistryHolderReactModule.h>

@interface ABI38_0_0UMModuleRegistryHolderReactModule ()

@property (nonatomic, weak) ABI38_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI38_0_0UMModuleRegistryHolderReactModule

- (instancetype)initWithModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI38_0_0UMModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
