// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *EXModuleClasses;

void (^EXinitializeGlobalModulesRegistry)(void) = ^{
  EXModuleClasses = [NSMutableSet set];
};

extern void EXRegisterModule(Class);
extern void EXRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, EXinitializeGlobalModulesRegistry);
  [EXModuleClasses addObject:moduleClass];
}

@implementation EXModuleRegistryProvider

- (NSSet<Class> *)getModulesClasses
{
  return EXModuleClasses;
}

- (EXModuleRegistry *)moduleRegistryForExperienceId:(NSString *)experienceId
{
  NSMutableSet<id<EXInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<EXExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<EXViewManager *> *viewManagerModules = [NSMutableSet set];
  
  for (Class klass in [self getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(EXInternalModule)]) {
      EXLogWarn(@"Registered class `%@` does not conform to the `EXModule` protocol.", [klass description]);
      continue;
    }

    id<EXInternalModule> instance = [self createModuleInstance:klass forExperienceWithId:experienceId];
    
    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }
    
    if ([instance isKindOfClass:[EXExportedModule class]]) {
      [exportedModules addObject:(EXExportedModule *)instance];
    }
    
    if ([instance isKindOfClass:[EXViewManager class]]) {
      [viewManagerModules addObject:(EXViewManager *)instance];
    }
  }
  
  EXModuleRegistry *moduleRegistry = [[EXModuleRegistry alloc] initWithInternalModules:internalModules exportedModules:exportedModules viewManagers:viewManagerModules];;
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<EXInternalModule>)createModuleInstance:(Class)moduleClass forExperienceWithId:(NSString *)experienceId
{
  id<EXInternalModule> instance;
  if ([moduleClass instancesRespondToSelector:@selector(initWithExperienceId:)]) {
    instance = [[moduleClass alloc] initWithExperienceId:experienceId];
  } else {
    instance = [[moduleClass alloc] init];
  }
  return instance;
}

@end
