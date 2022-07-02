// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryHolderReactModule.h>

@interface ABI45_0_0EXModuleRegistryHolderReactModule ()

@property (nonatomic, weak) ABI45_0_0EXModuleRegistry *exModuleRegistry;

@end

@implementation ABI45_0_0EXModuleRegistryHolderReactModule

- (instancetype)initWithModuleRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _exModuleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI45_0_0EXModuleRegistry *)exModuleRegistry
{
  return _exModuleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
