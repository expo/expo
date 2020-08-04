// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMReactNativeAdapter/ABI37_0_0UMModuleRegistryHolderReactModule.h>

@interface ABI37_0_0UMModuleRegistryHolderReactModule ()

@property (nonatomic, weak) ABI37_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI37_0_0UMModuleRegistryHolderReactModule

- (instancetype)initWithModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  return _moduleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
