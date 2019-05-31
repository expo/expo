// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMSingletonModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *ABI33_0_0UMModuleClasses;
static NSMutableSet<Class> *ABI33_0_0UMSingletonModuleClasses;

void (^ABI33_0_0UMinitializeGlobalModulesRegistry)(void) = ^{
  ABI33_0_0UMModuleClasses = [NSMutableSet set];
  ABI33_0_0UMSingletonModuleClasses = [NSMutableSet set];
};

extern void ABI33_0_0UMRegisterModule(Class);
extern void ABI33_0_0UMRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, ABI33_0_0UMinitializeGlobalModulesRegistry);
  [ABI33_0_0UMModuleClasses addObject:moduleClass];
}

extern void ABI33_0_0UMRegisterSingletonModule(Class);
extern void ABI33_0_0UMRegisterSingletonModule(Class singletonModuleClass)
{
  dispatch_once(&onceToken, ABI33_0_0UMinitializeGlobalModulesRegistry);
  [ABI33_0_0UMSingletonModuleClasses addObject:singletonModuleClass];
}

// Singleton modules classes register in ABI33_0_0UMSingletonModuleClasses
// with ABI33_0_0UMRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<ABI33_0_0UMSingletonModule *> *ABI33_0_0UMSingletonModules;
void (^ABI33_0_0UMinitializeGlobalSingletonModulesSet)(void) = ^{
  ABI33_0_0UMSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in ABI33_0_0UMSingletonModuleClasses) {
    [ABI33_0_0UMSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface ABI33_0_0UMModuleRegistryProvider ()

@property (nonatomic, strong) NSSet *singletonModules;

@end

@implementation ABI33_0_0UMModuleRegistryProvider

- (instancetype)init
{
  return [self initWithSingletonModules:[ABI33_0_0UMModuleRegistryProvider singletonModules]];
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
  return ABI33_0_0UMModuleClasses;
}

+ (NSSet<ABI33_0_0UMSingletonModule *> *)singletonModules
{
  dispatch_once(&onceSingletonModulesToken, ABI33_0_0UMinitializeGlobalSingletonModulesSet);
  return ABI33_0_0UMSingletonModules;
}

+ (nullable ABI33_0_0UMSingletonModule *)getSingletonModuleForClass:(Class)singletonClass
{
  NSSet<ABI33_0_0UMSingletonModule *> *singletonModules = [self singletonModules];

  for (ABI33_0_0UMSingletonModule *singleton in singletonModules) {
    if ([singleton isKindOfClass:singletonClass]) {
      return singleton;
    }
  }
  return nil;
}

- (ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  NSMutableSet<id<ABI33_0_0UMInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<ABI33_0_0UMExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<ABI33_0_0UMViewManager *> *viewManagerModules = [NSMutableSet set];

  for (Class klass in [self getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(ABI33_0_0UMInternalModule)]) {
      ABI33_0_0UMLogWarn(@"Registered class `%@` does not conform to the `ABI33_0_0UMModule` protocol.", [klass description]);
      continue;
    }

    id<ABI33_0_0UMInternalModule> instance = [self createModuleInstance:klass];

    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }

    if ([instance isKindOfClass:[ABI33_0_0UMExportedModule class]]) {
      [exportedModules addObject:(ABI33_0_0UMExportedModule *)instance];
    }

    if ([instance isKindOfClass:[ABI33_0_0UMViewManager class]]) {
      [viewManagerModules addObject:(ABI33_0_0UMViewManager *)instance];
    }
  }

  ABI33_0_0UMModuleRegistry *moduleRegistry = [[ABI33_0_0UMModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<ABI33_0_0UMInternalModule>)createModuleInstance:(Class)moduleClass
{
  return [[moduleClass alloc] init];
}

@end
