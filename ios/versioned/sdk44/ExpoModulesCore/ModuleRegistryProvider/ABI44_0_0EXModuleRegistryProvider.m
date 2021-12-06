// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXSingletonModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *ABI44_0_0EXModuleClasses;
static NSMutableSet<Class> *ABI44_0_0EXSingletonModuleClasses;

void (^ABI44_0_0EXinitializeGlobalModulesRegistry)(void) = ^{
  ABI44_0_0EXModuleClasses = [NSMutableSet set];
  ABI44_0_0EXSingletonModuleClasses = [NSMutableSet set];
};

extern void ABI44_0_0EXRegisterModule(Class);
extern void ABI44_0_0EXRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, ABI44_0_0EXinitializeGlobalModulesRegistry);
  [ABI44_0_0EXModuleClasses addObject:moduleClass];
}

extern void ABI44_0_0EXRegisterSingletonModule(Class);
extern void ABI44_0_0EXRegisterSingletonModule(Class singletonModuleClass)
{
  dispatch_once(&onceToken, ABI44_0_0EXinitializeGlobalModulesRegistry);

  // A heuristic solution to "multiple singletons registering
  // to the same name" problem. Usually it happens when we want to
  // override module singleton with an ExpoKit one. This solution
  // gives preference to subclasses.

  // If a superclass of a registering singleton is already registered
  // we want to remove it in favor of the registering singleton.
  Class superClass = [singletonModuleClass superclass];
  while (superClass != [NSObject class]) {
    [ABI44_0_0EXSingletonModuleClasses removeObject:superClass];
    superClass = [superClass superclass];
  }

  // If a registering singleton is a superclass of an already registered
  // singleton, we don't register it.
  for (Class registeredClass in ABI44_0_0EXSingletonModuleClasses) {
    if ([singletonModuleClass isSubclassOfClass:registeredClass]) {
      return;
    }
  }

  [ABI44_0_0EXSingletonModuleClasses addObject:singletonModuleClass];
}

// Singleton modules classes register in ABI44_0_0EXSingletonModuleClasses
// with ABI44_0_0EXRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<ABI44_0_0EXSingletonModule *> *ABI44_0_0EXSingletonModules;
void (^ABI44_0_0EXinitializeGlobalSingletonModulesSet)(void) = ^{
  ABI44_0_0EXSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in ABI44_0_0EXSingletonModuleClasses) {
    [ABI44_0_0EXSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface ABI44_0_0EXModuleRegistryProvider ()

@property (nonatomic, strong) NSSet *singletonModules;

@end

@implementation ABI44_0_0EXModuleRegistryProvider

- (instancetype)init
{
  return [self initWithSingletonModules:[ABI44_0_0EXModuleRegistryProvider singletonModules]];
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
  return ABI44_0_0EXModuleClasses;
}

+ (NSSet<ABI44_0_0EXSingletonModule *> *)singletonModules
{
  dispatch_once(&onceSingletonModulesToken, ABI44_0_0EXinitializeGlobalSingletonModulesSet);
  return ABI44_0_0EXSingletonModules;
}

+ (nullable ABI44_0_0EXSingletonModule *)getSingletonModuleForClass:(Class)singletonClass
{
  NSSet<ABI44_0_0EXSingletonModule *> *singletonModules = [self singletonModules];

  for (ABI44_0_0EXSingletonModule *singleton in singletonModules) {
    if ([singleton isKindOfClass:singletonClass]) {
      return singleton;
    }
  }
  return nil;
}

- (ABI44_0_0EXModuleRegistry *)moduleRegistry
{
  NSMutableSet<id<ABI44_0_0EXInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<ABI44_0_0EXExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<ABI44_0_0EXViewManager *> *viewManagerModules = [NSMutableSet set];

  for (Class klass in [self.class getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(ABI44_0_0EXInternalModule)]) {
      ABI44_0_0EXLogWarn(@"Registered class `%@` does not conform to the `ABI44_0_0EXInternalModule` protocol.", [klass description]);
      continue;
    }

    id<ABI44_0_0EXInternalModule> instance = [self createModuleInstance:klass];

    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }

    if ([instance isKindOfClass:[ABI44_0_0EXExportedModule class]]) {
      [exportedModules addObject:(ABI44_0_0EXExportedModule *)instance];
    }

    if ([instance isKindOfClass:[ABI44_0_0EXViewManager class]]) {
      [viewManagerModules addObject:(ABI44_0_0EXViewManager *)instance];
    }
  }

  ABI44_0_0EXModuleRegistry *moduleRegistry = [[ABI44_0_0EXModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<ABI44_0_0EXInternalModule>)createModuleInstance:(Class)moduleClass
{
  return [[moduleClass alloc] init];
}

@end
