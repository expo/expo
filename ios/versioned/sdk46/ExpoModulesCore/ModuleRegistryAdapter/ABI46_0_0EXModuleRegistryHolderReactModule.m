// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryHolderReactModule.h>

@interface ABI46_0_0EXModuleRegistryHolderReactModule ()

@property (nonatomic, weak) ABI46_0_0EXModuleRegistry *exModuleRegistry;

@end

@implementation ABI46_0_0EXModuleRegistryHolderReactModule

- (instancetype)initWithModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _exModuleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI46_0_0EXModuleRegistry *)exModuleRegistry
{
  return _exModuleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
