// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMReactNativeAdapter/ABI39_0_0UMModuleRegistryHolderReactModule.h>

@interface ABI39_0_0UMModuleRegistryHolderReactModule ()

@property (nonatomic, weak) ABI39_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI39_0_0UMModuleRegistryHolderReactModule

- (instancetype)initWithModuleRegistry:(ABI39_0_0UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI39_0_0UMModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
