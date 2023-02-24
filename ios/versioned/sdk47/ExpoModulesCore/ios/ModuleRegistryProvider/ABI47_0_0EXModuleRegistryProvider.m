// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXSingletonModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *ABI47_0_0EXModuleClasses;
static NSMutableSet<Class> *ABI47_0_0EXSingletonModuleClasses;

void (^ABI47_0_0EXinitializeGlobalModulesRegistry)(void) = ^{
  ABI47_0_0EXModuleClasses = [NSMutableSet set];
  ABI47_0_0EXSingletonModuleClasses = [NSMutableSet set];
};

extern void ABI47_0_0EXRegisterModule(Class);
extern void ABI47_0_0EXRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, ABI47_0_0EXinitializeGlobalModulesRegistry);
  [ABI47_0_0EXModuleClasses addObject:moduleClass];
}

extern void ABI47_0_0EXRegisterSingletonModule(Class);
extern void ABI47_0_0EXRegisterSingletonModule(Class singletonModuleClass)
{
  dispatch_once(&onceToken, ABI47_0_0EXinitializeGlobalModulesRegistry);

  // A heuristic solution to "multiple singletons registering
  // to the same name" problem. Usually it happens when we want to
  // override module singleton with an ExpoKit one. This solution
  // gives preference to subclasses.

  // If a superclass of a registering singleton is already registered
  // we want to remove it in favor of the registering singleton.
  Class superClass = [singletonModuleClass superclass];
  while (superClass != [NSObject class]) {
    [ABI47_0_0EXSingletonModuleClasses removeObject:superClass];
    superClass = [superClass superclass];
  }

  // If a registering singleton is a superclass of an already registered
  // singleton, we don't register it.
  for (Class registeredClass in ABI47_0_0EXSingletonModuleClasses) {
    if ([singletonModuleClass isSubclassOfClass:registeredClass]) {
      return;
    }
  }

  [ABI47_0_0EXSingletonModuleClasses addObject:singletonModuleClass];
}

// Singleton modules classes register in ABI47_0_0EXSingletonModuleClasses
// with ABI47_0_0EXRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<ABI47_0_0EXSingletonModule *> *ABI47_0_0EXSingletonModules;
void (^ABI47_0_0EXinitializeGlobalSingletonModulesSet)(void) = ^{
  ABI47_0_0EXSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in ABI47_0_0EXSingletonModuleClasses) {
    [ABI47_0_0EXSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface ABI47_0_0EXModuleRegistryProvider ()

@property (nonatomic, strong) NSSet *singletonModules;

@end

@implementation ABI47_0_0EXModuleRegistryProvider

- (instancetype)init
{
  return [self initWithSingletonModules:[ABI47_0_0EXModuleRegistryProvider singletonModules]];
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
  return ABI47_0_0EXModuleClasses;
}

+ (NSSet<ABI47_0_0EXSingletonModule *> *)singletonModules
{
  dispatch_once(&onceSingletonModulesToken, ABI47_0_0EXinitializeGlobalSingletonModulesSet);
  return ABI47_0_0EXSingletonModules;
}

+ (nullable ABI47_0_0EXSingletonModule *)getSingletonModuleForClass:(Class)singletonClass
{
  NSSet<ABI47_0_0EXSingletonModule *> *singletonModules = [self singletonModules];

  for (ABI47_0_0EXSingletonModule *singleton in singletonModules) {
    if ([singleton isKindOfClass:singletonClass]) {
      return singleton;
    }
  }
  return nil;
}

- (ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  NSMutableSet<id<ABI47_0_0EXInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<ABI47_0_0EXExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<ABI47_0_0EXViewManager *> *viewManagerModules = [NSMutableSet set];

  for (Class klass in [self.class getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(ABI47_0_0EXInternalModule)]) {
      ABI47_0_0EXLogWarn(@"Registered class `%@` does not conform to the `ABI47_0_0EXInternalModule` protocol.", [klass description]);
      continue;
    }

    id<ABI47_0_0EXInternalModule> instance = [self createModuleInstance:klass];

    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }

    if ([instance isKindOfClass:[ABI47_0_0EXExportedModule class]]) {
      [exportedModules addObject:(ABI47_0_0EXExportedModule *)instance];
    }

    if ([instance isKindOfClass:[ABI47_0_0EXViewManager class]]) {
      [viewManagerModules addObject:(ABI47_0_0EXViewManager *)instance];
    }
  }

  ABI47_0_0EXModuleRegistry *moduleRegistry = [[ABI47_0_0EXModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<ABI47_0_0EXInternalModule>)createModuleInstance:(Class)moduleClass
{
  return [[moduleClass alloc] init];
}

@end
