// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXSingletonModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *ABI48_0_0EXModuleClasses;
static NSMutableSet<Class> *ABI48_0_0EXSingletonModuleClasses;

void (^ABI48_0_0EXinitializeGlobalModulesRegistry)(void) = ^{
  ABI48_0_0EXModuleClasses = [NSMutableSet set];
  ABI48_0_0EXSingletonModuleClasses = [NSMutableSet set];
};

extern void ABI48_0_0EXRegisterModule(Class);
extern void ABI48_0_0EXRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, ABI48_0_0EXinitializeGlobalModulesRegistry);
  [ABI48_0_0EXModuleClasses addObject:moduleClass];
}

extern void ABI48_0_0EXRegisterSingletonModule(Class);
extern void ABI48_0_0EXRegisterSingletonModule(Class singletonModuleClass)
{
  dispatch_once(&onceToken, ABI48_0_0EXinitializeGlobalModulesRegistry);

  // A heuristic solution to "multiple singletons registering
  // to the same name" problem. Usually it happens when we want to
  // override module singleton with an ExpoKit one. This solution
  // gives preference to subclasses.

  // If a superclass of a registering singleton is already registered
  // we want to remove it in favor of the registering singleton.
  Class superClass = [singletonModuleClass superclass];
  while (superClass != [NSObject class]) {
    [ABI48_0_0EXSingletonModuleClasses removeObject:superClass];
    superClass = [superClass superclass];
  }

  // If a registering singleton is a superclass of an already registered
  // singleton, we don't register it.
  for (Class registeredClass in ABI48_0_0EXSingletonModuleClasses) {
    if ([singletonModuleClass isSubclassOfClass:registeredClass]) {
      return;
    }
  }

  [ABI48_0_0EXSingletonModuleClasses addObject:singletonModuleClass];
}

// Singleton modules classes register in ABI48_0_0EXSingletonModuleClasses
// with ABI48_0_0EXRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<ABI48_0_0EXSingletonModule *> *ABI48_0_0EXSingletonModules;
void (^ABI48_0_0EXinitializeGlobalSingletonModulesSet)(void) = ^{
  ABI48_0_0EXSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in ABI48_0_0EXSingletonModuleClasses) {
    [ABI48_0_0EXSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface ABI48_0_0EXModuleRegistryProvider ()

@property (nonatomic, strong) NSSet *singletonModules;

@end

@implementation ABI48_0_0EXModuleRegistryProvider

- (instancetype)init
{
  return [self initWithSingletonModules:[ABI48_0_0EXModuleRegistryProvider singletonModules]];
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
  return ABI48_0_0EXModuleClasses;
}

+ (NSSet<ABI48_0_0EXSingletonModule *> *)singletonModules
{
  dispatch_once(&onceSingletonModulesToken, ABI48_0_0EXinitializeGlobalSingletonModulesSet);
  return ABI48_0_0EXSingletonModules;
}

+ (nullable ABI48_0_0EXSingletonModule *)getSingletonModuleForClass:(Class)singletonClass
{
  NSSet<ABI48_0_0EXSingletonModule *> *singletonModules = [self singletonModules];

  for (ABI48_0_0EXSingletonModule *singleton in singletonModules) {
    if ([singleton isKindOfClass:singletonClass]) {
      return singleton;
    }
  }
  return nil;
}

- (ABI48_0_0EXModuleRegistry *)moduleRegistry
{
  NSMutableSet<id<ABI48_0_0EXInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<ABI48_0_0EXExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<ABI48_0_0EXViewManager *> *viewManagerModules = [NSMutableSet set];

  for (Class klass in [self.class getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(ABI48_0_0EXInternalModule)]) {
      ABI48_0_0EXLogWarn(@"Registered class `%@` does not conform to the `ABI48_0_0EXInternalModule` protocol.", [klass description]);
      continue;
    }

    id<ABI48_0_0EXInternalModule> instance = [self createModuleInstance:klass];

    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }

    if ([instance isKindOfClass:[ABI48_0_0EXExportedModule class]]) {
      [exportedModules addObject:(ABI48_0_0EXExportedModule *)instance];
    }

    if ([instance isKindOfClass:[ABI48_0_0EXViewManager class]]) {
      [viewManagerModules addObject:(ABI48_0_0EXViewManager *)instance];
    }
  }

  ABI48_0_0EXModuleRegistry *moduleRegistry = [[ABI48_0_0EXModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<ABI48_0_0EXInternalModule>)createModuleInstance:(Class)moduleClass
{
  return [[moduleClass alloc] init];
}

@end
