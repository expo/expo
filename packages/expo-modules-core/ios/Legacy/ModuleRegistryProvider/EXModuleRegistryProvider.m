// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXSingletonModule.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>

#import <ExpoModulesCore/Swift.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *EXModuleClasses;
static NSMutableSet<Class> *EXSingletonModuleClasses;

void (^EXinitializeGlobalModulesRegistry)(void) = ^{
  EXModuleClasses = [NSMutableSet set];
  EXSingletonModuleClasses = [NSMutableSet set];

  // Also add temporary Swift modules from core
  [EXModuleClasses addObject:[EXFileSystemLegacyUtilities class]];
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

  // A heuristic solution to "multiple singletons registering
  // to the same name" problem. Usually it happens when we want to
  // override module singleton with an ExpoKit one. This solution
  // gives preference to subclasses.

  // If a superclass of a registering singleton is already registered
  // we want to remove it in favor of the registering singleton.
  Class superClass = [singletonModuleClass superclass];
  while (superClass != [NSObject class]) {
    [EXSingletonModuleClasses removeObject:superClass];
    superClass = [superClass superclass];
  }

  // If a registering singleton is a superclass of an already registered
  // singleton, we don't register it.
  for (Class registeredClass in EXSingletonModuleClasses) {
    if ([singletonModuleClass isSubclassOfClass:registeredClass]) {
      return;
    }
  }

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

+ (NSSet<Class> *)getModulesClasses
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

- (EXModuleRegistry *)moduleRegistry
{
  NSMutableSet<id<EXInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<EXExportedModule *> *exportedModules = [NSMutableSet set];

  for (Class klass in [self.class getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(EXInternalModule)]) {
      EXLogWarn(@"Registered class `%@` does not conform to the `EXInternalModule` protocol.", [klass description]);
      continue;
    }

    id<EXInternalModule> instance = [self createModuleInstance:klass];

    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }

    if ([instance isKindOfClass:[EXExportedModule class]]) {
      [exportedModules addObject:(EXExportedModule *)instance];
    }
  }

  EXModuleRegistry *moduleRegistry = [[EXModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                      singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<EXInternalModule>)createModuleInstance:(Class)moduleClass
{
  return [[moduleClass alloc] init];
}

@end
