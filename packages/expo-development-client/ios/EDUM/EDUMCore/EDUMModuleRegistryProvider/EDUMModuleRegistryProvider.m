// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EDUMSingletonModule.h>
#import <EDUMModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *EDUMModuleClasses;
static NSMutableSet<Class> *EDUMSingletonModuleClasses;

void (^EDUMinitializeGlobalModulesRegistry)(void) = ^{
  EDUMModuleClasses = [NSMutableSet set];
  EDUMSingletonModuleClasses = [NSMutableSet set];
};

extern void EDUMRegisterModule(Class);
extern void EDUMRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, EDUMinitializeGlobalModulesRegistry);
  [EDUMModuleClasses addObject:moduleClass];
}

extern void EDUMRegisterSingletonModule(Class);
extern void EDUMRegisterSingletonModule(Class singletonModuleClass)
{
  dispatch_once(&onceToken, EDUMinitializeGlobalModulesRegistry);

  // A heuristic solution to "multiple singletons registering
  // to the same name" problem. Usually it happens when we want to
  // override unimodule singleton with an ExpoKit one. This solution
  // gives preference to subclasses.

  // If a superclass of a registering singleton is already registered
  // we want to remove it in favor of the registering singleton.
  Class superClass = [singletonModuleClass superclass];
  while (superClass != [NSObject class]) {
    [EDUMSingletonModuleClasses removeObject:superClass];
    superClass = [superClass superclass];
  }

  // If a registering singleton is a superclass of an already registered
  // singleton, we don't register it.
  for (Class registeredClass in EDUMSingletonModuleClasses) {
    if ([singletonModuleClass isSubclassOfClass:registeredClass]) {
      return;
    }
  }

  [EDUMSingletonModuleClasses addObject:singletonModuleClass];
}

// Singleton modules classes register in EDUMSingletonModuleClasses
// with EDUMRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<EDUMSingletonModule *> *EDUMSingletonModules;
void (^EDUMinitializeGlobalSingletonModulesSet)(void) = ^{
  EDUMSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in EDUMSingletonModuleClasses) {
    [EDUMSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface EDUMModuleRegistryProvider ()

@property (nonatomic, strong) NSSet *singletonModules;

@end

@implementation EDUMModuleRegistryProvider

- (instancetype)init
{
  return [self initWithSingletonModules:[EDUMModuleRegistryProvider singletonModules]];
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
  return EDUMModuleClasses;
}

+ (NSSet<EDUMSingletonModule *> *)singletonModules
{
  dispatch_once(&onceSingletonModulesToken, EDUMinitializeGlobalSingletonModulesSet);
  return EDUMSingletonModules;
}

+ (nullable EDUMSingletonModule *)getSingletonModuleForClass:(Class)singletonClass
{
  NSSet<EDUMSingletonModule *> *singletonModules = [self singletonModules];

  for (EDUMSingletonModule *singleton in singletonModules) {
    if ([singleton isKindOfClass:singletonClass]) {
      return singleton;
    }
  }
  return nil;
}

- (EDUMModuleRegistry *)moduleRegistry
{
  NSMutableSet<id<EDUMInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<EDUMExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<EDUMViewManager *> *viewManagerModules = [NSMutableSet set];

  for (Class klass in [self getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(EDUMInternalModule)]) {
      EDUMLogWarn(@"Registered class `%@` does not conform to the `EDUMModule` protocol.", [klass description]);
      continue;
    }

    id<EDUMInternalModule> instance = [self createModuleInstance:klass];

    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }

    if ([instance isKindOfClass:[EDUMExportedModule class]]) {
      [exportedModules addObject:(EDUMExportedModule *)instance];
    }

    if ([instance isKindOfClass:[EDUMViewManager class]]) {
      [viewManagerModules addObject:(EDUMViewManager *)instance];
    }
  }

  EDUMModuleRegistry *moduleRegistry = [[EDUMModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<EDUMInternalModule>)createModuleInstance:(Class)moduleClass
{
  return [[moduleClass alloc] init];
}

@end
