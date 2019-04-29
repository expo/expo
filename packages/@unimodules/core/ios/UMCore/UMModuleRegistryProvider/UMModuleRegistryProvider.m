// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMSingletonModule.h>
#import <UMCore/UMModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *UMModuleClasses;
static NSMutableSet<Class> *UMSingletonModuleClasses;

void (^UMinitializeGlobalModulesRegistry)(void) = ^{
  UMModuleClasses = [NSMutableSet set];
  UMSingletonModuleClasses = [NSMutableSet set];
};

extern void UMRegisterModule(Class);
extern void UMRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, UMinitializeGlobalModulesRegistry);
  [UMModuleClasses addObject:moduleClass];
}

extern void UMRegisterSingletonModule(Class);
extern void UMRegisterSingletonModule(Class singletonModuleClass)
{
  dispatch_once(&onceToken, UMinitializeGlobalModulesRegistry);
  [UMSingletonModuleClasses addObject:singletonModuleClass];
}

// Singleton modules classes register in UMSingletonModuleClasses
// with UMRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<UMSingletonModule *> *UMSingletonModules;
void (^UMinitializeGlobalSingletonModulesSet)(void) = ^{
  UMSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in UMSingletonModuleClasses) {
    [UMSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface UMModuleRegistryProvider ()

@property (nonatomic, strong) NSSet *singletonModules;

@end

@implementation UMModuleRegistryProvider

- (instancetype)init
{
  return [self initWithSingletonModules:[UMModuleRegistryProvider singletonModules]];
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
  return UMModuleClasses;
}

+ (NSSet<UMSingletonModule *> *)singletonModules
{
  dispatch_once(&onceSingletonModulesToken, UMinitializeGlobalSingletonModulesSet);
  return UMSingletonModules;
}

+ (nullable UMSingletonModule *)getSingletonModuleForClass:(Class)singletonClass
{
  NSSet<UMSingletonModule *> *singletonModules = [self singletonModules];

  for (UMSingletonModule *singleton in singletonModules) {
    if ([singleton isKindOfClass:singletonClass]) {
      return singleton;
    }
  }
  return nil;
}

- (UMModuleRegistry *)moduleRegistry
{
  NSMutableSet<id<UMInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<UMExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<UMViewManager *> *viewManagerModules = [NSMutableSet set];

  for (Class klass in [self getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(UMInternalModule)]) {
      UMLogWarn(@"Registered class `%@` does not conform to the `UMModule` protocol.", [klass description]);
      continue;
    }

    id<UMInternalModule> instance = [self createModuleInstance:klass];

    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }

    if ([instance isKindOfClass:[UMExportedModule class]]) {
      [exportedModules addObject:(UMExportedModule *)instance];
    }

    if ([instance isKindOfClass:[UMViewManager class]]) {
      [viewManagerModules addObject:(UMViewManager *)instance];
    }
  }

  UMModuleRegistry *moduleRegistry = [[UMModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<UMInternalModule>)createModuleInstance:(Class)moduleClass
{
  return [[moduleClass alloc] init];
}

@end
