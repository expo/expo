// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXSingletonModule.h>
#import <EXCore/EXModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *EXModuleClasses;
static NSMutableSet<Class> *EXSingletonModuleClasses;

void (^EXinitializeGlobalModulesRegistry)(void) = ^{
  EXModuleClasses = [NSMutableSet set];
  EXSingletonModuleClasses = [NSMutableSet set];
};

extern void EXRegisterModule(Class);
extern void EXRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, EXinitializeGlobalModulesRegistry);
  [EXModuleClasses addObject:moduleClass];
}

extern void EXRegisterSingletonModule(Class);
extern void EXRegisterSingletonModule(Class singletonModuleClass)
{
  dispatch_once(&onceToken, EXinitializeGlobalModulesRegistry);
  [EXSingletonModuleClasses addObject:singletonModuleClass];
}

// Singleton modules classes register in EXSingletonModuleClasses
// with EXRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<EXSingletonModule *> *EXSingletonModules;
void (^EXinitializeGlobalSingletonModulesSet)(void) = ^{
  EXSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in EXSingletonModuleClasses) {
    [EXSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface EXModuleRegistryProvider ()

@property (nonatomic, strong) NSSet *singletonModules;

@end

@implementation EXModuleRegistryProvider

- (instancetype)init
{
  return [self initWithSingletonModules:[EXModuleRegistryProvider singletonModules]];
}

- (instancetype)initWithSingletonModules:(NSSet *)modules
{
  if (self = [super init]) {
    _singletonModules = [NSSet setWithSet:modules];
  }
  return self;
}

- (NSSet<Class> *)getModulesClasses
{
  return EXModuleClasses;
}

+ (NSSet<EXSingletonModule *> *)singletonModules
{
  dispatch_once(&onceSingletonModulesToken, EXinitializeGlobalSingletonModulesSet);
  return EXSingletonModules;
}

+ (nullable EXSingletonModule *)getSingletonModuleForClass:(Class)singletonClass
{
  NSSet<EXSingletonModule *> *singletonModules = [self singletonModules];

  for (EXSingletonModule *singleton in singletonModules) {
    if ([singleton isKindOfClass:singletonClass]) {
      return singleton;
    }
  }
  return nil;
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

  EXModuleRegistry *moduleRegistry = [[EXModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:_singletonModules];
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
