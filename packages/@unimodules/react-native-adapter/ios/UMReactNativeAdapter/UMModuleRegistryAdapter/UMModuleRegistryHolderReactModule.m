// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMReactNativeAdapter/UMModuleRegistryHolderReactModule.h>

@interface UMModuleRegistryHolderReactModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation UMModuleRegistryHolderReactModule

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
