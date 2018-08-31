// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXSingletonModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *ABI30_0_0EXModuleClasses;
static NSMutableSet<Class> *ABI30_0_0EXSingletonModuleClasses;

void (^ABI30_0_0EXinitializeGlobalModulesRegistry)(void) = ^{
  ABI30_0_0EXModuleClasses = [NSMutableSet set];
  ABI30_0_0EXSingletonModuleClasses = [NSMutableSet set];
};

extern void ABI30_0_0EXRegisterModule(Class);
extern void ABI30_0_0EXRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, ABI30_0_0EXinitializeGlobalModulesRegistry);
  [ABI30_0_0EXModuleClasses addObject:moduleClass];
}

extern void ABI30_0_0EXRegisterSingletonModule(Class);
extern void ABI30_0_0EXRegisterSingletonModule(Class singletonModuleClass)
{
  dispatch_once(&onceToken, ABI30_0_0EXinitializeGlobalModulesRegistry);
  [ABI30_0_0EXSingletonModuleClasses addObject:singletonModuleClass];
}

// Singleton modules classes register in ABI30_0_0EXSingletonModuleClasses
// with ABI30_0_0EXRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<ABI30_0_0EXSingletonModule *> *ABI30_0_0EXSingletonModules;
void (^ABI30_0_0EXinitializeGlobalSingletonModulesSet)(void) = ^{
  ABI30_0_0EXSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in ABI30_0_0EXSingletonModuleClasses) {
    [ABI30_0_0EXSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface ABI30_0_0EXModuleRegistryProvider ()

@property (nonatomic, strong) NSSet *singletonModules;

@end

@implementation ABI30_0_0EXModuleRegistryProvider

- (instancetype)init
{
  return [self initWithSingletonModules:[ABI30_0_0EXModuleRegistryProvider singletonModules]];
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
  return ABI30_0_0EXModuleClasses;
}

+ (NSSet<ABI30_0_0EXSingletonModule *> *)singletonModules
{
  dispatch_once(&onceSingletonModulesToken, ABI30_0_0EXinitializeGlobalSingletonModulesSet);
  return ABI30_0_0EXSingletonModules;
}

- (ABI30_0_0EXModuleRegistry *)moduleRegistryForExperienceId:(NSString *)experienceId
{
  NSMutableSet<id<ABI30_0_0EXInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<ABI30_0_0EXExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<ABI30_0_0EXViewManager *> *viewManagerModules = [NSMutableSet set];
  
  for (Class klass in [self getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(ABI30_0_0EXInternalModule)]) {
      ABI30_0_0EXLogWarn(@"Registered class `%@` does not conform to the `ABI30_0_0EXModule` protocol.", [klass description]);
      continue;
    }

    id<ABI30_0_0EXInternalModule> instance = [self createModuleInstance:klass forExperienceWithId:experienceId];
    
    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }
    
    if ([instance isKindOfClass:[ABI30_0_0EXExportedModule class]]) {
      [exportedModules addObject:(ABI30_0_0EXExportedModule *)instance];
    }
    
    if ([instance isKindOfClass:[ABI30_0_0EXViewManager class]]) {
      [viewManagerModules addObject:(ABI30_0_0EXViewManager *)instance];
    }
  }
  
  ABI30_0_0EXModuleRegistry *moduleRegistry = [[ABI30_0_0EXModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<ABI30_0_0EXInternalModule>)createModuleInstance:(Class)moduleClass forExperienceWithId:(NSString *)experienceId
{
  id<ABI30_0_0EXInternalModule> instance;
  if ([moduleClass instancesRespondToSelector:@selector(initWithExperienceId:)]) {
    instance = [[moduleClass alloc] initWithExperienceId:experienceId];
  } else {
    instance = [[moduleClass alloc] init];
  }
  return instance;
}

@end
