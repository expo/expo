// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMSingletonModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *ABI41_0_0UMModuleClasses;
static NSMutableSet<Class> *ABI41_0_0UMSingletonModuleClasses;

void (^ABI41_0_0UMinitializeGlobalModulesRegistry)(void) = ^{
  ABI41_0_0UMModuleClasses = [NSMutableSet set];
  ABI41_0_0UMSingletonModuleClasses = [NSMutableSet set];
};

extern void ABI41_0_0UMRegisterModule(Class);
extern void ABI41_0_0UMRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, ABI41_0_0UMinitializeGlobalModulesRegistry);
  [ABI41_0_0UMModuleClasses addObject:moduleClass];
}

extern void ABI41_0_0UMRegisterSingletonModule(Class);
extern void ABI41_0_0UMRegisterSingletonModule(Class singletonModuleClass)
{
  dispatch_once(&onceToken, ABI41_0_0UMinitializeGlobalModulesRegistry);

  // A heuristic solution to "multiple singletons registering
  // to the same name" problem. Usually it happens when we want to
  // override unimodule singleton with an ExpoKit one. This solution
  // gives preference to subclasses.

  // If a superclass of a registering singleton is already registered
  // we want to remove it in favor of the registering singleton.
  Class superClass = [singletonModuleClass superclass];
  while (superClass != [NSObject class]) {
    [ABI41_0_0UMSingletonModuleClasses removeObject:superClass];
    superClass = [superClass superclass];
  }

  // If a registering singleton is a superclass of an already registered
  // singleton, we don't register it.
  for (Class registeredClass in ABI41_0_0UMSingletonModuleClasses) {
    if ([singletonModuleClass isSubclassOfClass:registeredClass]) {
      return;
    }
  }

  [ABI41_0_0UMSingletonModuleClasses addObject:singletonModuleClass];
}

// Singleton modules classes register in ABI41_0_0UMSingletonModuleClasses
// with ABI41_0_0UMRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<ABI41_0_0UMSingletonModule *> *ABI41_0_0UMSingletonModules;
void (^ABI41_0_0UMinitializeGlobalSingletonModulesSet)(void) = ^{
  ABI41_0_0UMSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in ABI41_0_0UMSingletonModuleClasses) {
    [ABI41_0_0UMSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface ABI41_0_0UMModuleRegistryProvider ()

@property (nonatomic, strong) NSSet *singletonModules;

@end

@implementation ABI41_0_0UMModuleRegistryProvider

- (instancetype)init
{
  return [self initWithSingletonModules:[ABI41_0_0UMModuleRegistryProvider singletonModules]];
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
  return ABI41_0_0UMModuleClasses;
}

+ (NSSet<ABI41_0_0UMSingletonModule *> *)singletonModules
{
  dispatch_once(&onceSingletonModulesToken, ABI41_0_0UMinitializeGlobalSingletonModulesSet);
  return ABI41_0_0UMSingletonModules;
}

+ (nullable ABI41_0_0UMSingletonModule *)getSingletonModuleForClass:(Class)singletonClass
{
  NSSet<ABI41_0_0UMSingletonModule *> *singletonModules = [self singletonModules];

  for (ABI41_0_0UMSingletonModule *singleton in singletonModules) {
    if ([singleton isKindOfClass:singletonClass]) {
      return singleton;
    }
  }
  return nil;
}

- (ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  NSMutableSet<id<ABI41_0_0UMInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<ABI41_0_0UMExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<ABI41_0_0UMViewManager *> *viewManagerModules = [NSMutableSet set];

  for (Class klass in [self getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(ABI41_0_0UMInternalModule)]) {
      ABI41_0_0UMLogWarn(@"Registered class `%@` does not conform to the `ABI41_0_0UMModule` protocol.", [klass description]);
      continue;
    }

    id<ABI41_0_0UMInternalModule> instance = [self createModuleInstance:klass];

    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }

    if ([instance isKindOfClass:[ABI41_0_0UMExportedModule class]]) {
      [exportedModules addObject:(ABI41_0_0UMExportedModule *)instance];
    }

    if ([instance isKindOfClass:[ABI41_0_0UMViewManager class]]) {
      [viewManagerModules addObject:(ABI41_0_0UMViewManager *)instance];
    }
  }

  ABI41_0_0UMModuleRegistry *moduleRegistry = [[ABI41_0_0UMModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<ABI41_0_0UMInternalModule>)createModuleInstance:(Class)moduleClass
{
  return [[moduleClass alloc] init];
}

@end
