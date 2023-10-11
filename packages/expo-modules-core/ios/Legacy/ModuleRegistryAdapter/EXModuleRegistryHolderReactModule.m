// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistryHolderReactModule.h>

@interface EXModuleRegistryHolderReactModule ()

@property (nonatomic, nullable, weak) EXModuleRegistry *exModuleRegistry;

@end

@implementation EXModuleRegistryHolderReactModule

- (nonnull instancetype)initWithModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _exModuleRegistry = moduleRegistry;
  }
  return self;
}

- (nullable EXModuleRegistry *)exModuleRegistry
{
  return _exModuleRegistry;
}

+ (nullable NSString *)moduleName {
  return nil;
}

@end
