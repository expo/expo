// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryHolderReactModule.h>

@interface ABI43_0_0EXModuleRegistryHolderReactModule ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *exModuleRegistry;

@end

@implementation ABI43_0_0EXModuleRegistryHolderReactModule

- (instancetype)initWithModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _exModuleRegistry = moduleRegistry;
  }
  return self;
}

- (ABI43_0_0EXModuleRegistry *)exModuleRegistry
{
  return _exModuleRegistry;
}

+ (NSString *)moduleName {
  return nil;
}

@end
