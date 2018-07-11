// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXSingletonModule.h>
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

@interface EXModuleRegistryProvider ()

@property (nonatomic, strong) NSMutableSet<Class> *singletonModuleClasses;

@end

@implementation EXModuleRegistryProvider

- (instancetype)initWithSingletonModuleClasses:(NSSet *)moduleClasses
{
  if (self = [super init]) {
    _singletonModuleClasses = [NSMutableSet set];
    for (Class klass in moduleClasses) {
      [_singletonModuleClasses addObject:klass];
    }
  }
  return self;
}

- (NSSet<Class> *)getModulesClasses
{
  return EXModuleClasses;
}

- (EXModuleRegistry *)moduleRegistryForExperienceId:(NSString *)experienceId
{
  NSMutableSet<id<EXInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<EXExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<EXViewManager *> *viewManagerModules = [NSMutableSet set];
  NSMutableSet<EXSingletonModule *> *singletonModules = [NSMutableSet set];
 
  // we can't wrap these in the EXRegisterModule macro because we want this hook to be robust to vendoring/versioning
  for (Class klass in _singletonModuleClasses) {
    EXSingletonModule *singletonModuleInstance = [[klass class] sharedInstance];
    [singletonModules addObject:singletonModuleInstance];
    continue;
  }
  
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
  
  EXModuleRegistry *moduleRegistry = [[EXModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:singletonModules];
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
