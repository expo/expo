// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMReactNativeAdapter/UMModuleRegistryHolderReactModule.h>

@interface UMModuleRegistryHolderReactModule ()

@property (nonatomic, weak) UMModuleRegistry *umModuleRegistry;

@end

@implementation UMModuleRegistryHolderReactModule

- (instancetype)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _umModuleRegistry = moduleRegistry;
  }
  return self;
}

- (UMModuleRegistry *)umModuleRegistry
{
  return _umModuleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
