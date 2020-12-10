// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMSingletonModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *ABI39_0_0UMModuleClasses;
static NSMutableSet<Class> *ABI39_0_0UMSingletonModuleClasses;

void (^ABI39_0_0UMinitializeGlobalModulesRegistry)(void) = ^{
  ABI39_0_0UMModuleClasses = [NSMutableSet set];
  ABI39_0_0UMSingletonModuleClasses = [NSMutableSet set];
};

extern void ABI39_0_0UMRegisterModule(Class);
extern void ABI39_0_0UMRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, ABI39_0_0UMinitializeGlobalModulesRegistry);
  [ABI39_0_0UMModuleClasses addObject:moduleClass];
}

extern void ABI39_0_0UMRegisterSingletonModule(Class);
extern void ABI39_0_0UMRegisterSingletonModule(Class singletonModuleClass)
{
  dispatch_once(&onceToken, ABI39_0_0UMinitializeGlobalModulesRegistry);

  // A heuristic solution to "multiple singletons registering
  // to the same name" problem. Usually it happens when we want to
  // override unimodule singleton with an ExpoKit one. This solution
  // gives preference to subclasses.

  // If a superclass of a registering singleton is already registered
  // we want to remove it in favor of the registering singleton.
  Class superClass = [singletonModuleClass superclass];
  while (superClass != [NSObject class]) {
    [ABI39_0_0UMSingletonModuleClasses removeObject:superClass];
    superClass = [superClass superclass];
  }

  // If a registering singleton is a superclass of an already registered
  // singleton, we don't register it.
  for (Class registeredClass in ABI39_0_0UMSingletonModuleClasses) {
    if ([singletonModuleClass isSubclassOfClass:registeredClass]) {
      return;
    }
  }

  [ABI39_0_0UMSingletonModuleClasses addObject:singletonModuleClass];
}

// Singleton modules classes register in ABI39_0_0UMSingletonModuleClasses
// with ABI39_0_0UMRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<ABI39_0_0UMSingletonModule *> *ABI39_0_0UMSingletonModules;
void (^ABI39_0_0UMinitializeGlobalSingletonModulesSet)(void) = ^{
  ABI39_0_0UMSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in ABI39_0_0UMSingletonModuleClasses) {
    [ABI39_0_0UMSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface ABI39_0_0UMModuleRegistryProvider ()

@property (nonatomic, strong) NSSet *singletonModules;

@end

@implementation ABI39_0_0UMModuleRegistryProvider

- (instancetype)init
{
  return [self initWithSingletonModules:[ABI39_0_0UMModuleRegistryProvider singletonModules]];
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
  return ABI39_0_0UMModuleClasses;
}

+ (NSSet<ABI39_0_0UMSingletonModule *> *)singletonModules
{
  dispatch_once(&onceSingletonModulesToken, ABI39_0_0UMinitializeGlobalSingletonModulesSet);
  return ABI39_0_0UMSingletonModules;
}

+ (nullable ABI39_0_0UMSingletonModule *)getSingletonModuleForClass:(Class)singletonClass
{
  NSSet<ABI39_0_0UMSingletonModule *> *singletonModules = [self singletonModules];

  for (ABI39_0_0UMSingletonModule *singleton in singletonModules) {
    if ([singleton isKindOfClass:singletonClass]) {
      return singleton;
    }
  }
  return nil;
}

- (ABI39_0_0UMModuleRegistry *)moduleRegistry
{
  NSMutableSet<id<ABI39_0_0UMInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<ABI39_0_0UMExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<ABI39_0_0UMViewManager *> *viewManagerModules = [NSMutableSet set];

  for (Class klass in [self getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(ABI39_0_0UMInternalModule)]) {
      ABI39_0_0UMLogWarn(@"Registered class `%@` does not conform to the `ABI39_0_0UMModule` protocol.", [klass description]);
      continue;
    }

    id<ABI39_0_0UMInternalModule> instance = [self createModuleInstance:klass];

    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }

    if ([instance isKindOfClass:[ABI39_0_0UMExportedModule class]]) {
      [exportedModules addObject:(ABI39_0_0UMExportedModule *)instance];
    }

    if ([instance isKindOfClass:[ABI39_0_0UMViewManager class]]) {
      [viewManagerModules addObject:(ABI39_0_0UMViewManager *)instance];
    }
  }

  ABI39_0_0UMModuleRegistry *moduleRegistry = [[ABI39_0_0UMModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<ABI39_0_0UMInternalModule>)createModuleInstance:(Class)moduleClass
{
  return [[moduleClass alloc] init];
}

@end
