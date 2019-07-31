// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXSingletonModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *ABI31_0_0EXModuleClasses;
static NSMutableSet<Class> *ABI31_0_0EXSingletonModuleClasses;

void (^ABI31_0_0EXinitializeGlobalModulesRegistry)(void) = ^{
  ABI31_0_0EXModuleClasses = [NSMutableSet set];
  ABI31_0_0EXSingletonModuleClasses = [NSMutableSet set];
};

extern void ABI31_0_0EXRegisterModule(Class);
extern void ABI31_0_0EXRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, ABI31_0_0EXinitializeGlobalModulesRegistry);
  [ABI31_0_0EXModuleClasses addObject:moduleClass];
}

extern void ABI31_0_0EXRegisterSingletonModule(Class);
extern void ABI31_0_0EXRegisterSingletonModule(Class singletonModuleClass)
{
  dispatch_once(&onceToken, ABI31_0_0EXinitializeGlobalModulesRegistry);
  [ABI31_0_0EXSingletonModuleClasses addObject:singletonModuleClass];
}

// Singleton modules classes register in ABI31_0_0EXSingletonModuleClasses
// with ABI31_0_0EXRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<ABI31_0_0EXSingletonModule *> *ABI31_0_0EXSingletonModules;
void (^ABI31_0_0EXinitializeGlobalSingletonModulesSet)(void) = ^{
  ABI31_0_0EXSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in ABI31_0_0EXSingletonModuleClasses) {
    [ABI31_0_0EXSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface ABI31_0_0EXModuleRegistryProvider ()

@property (nonatomic, strong) NSSet *singletonModules;

@end

@implementation ABI31_0_0EXModuleRegistryProvider

- (instancetype)init
{
  return [self initWithSingletonModules:[ABI31_0_0EXModuleRegistryProvider singletonModules]];
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
  return ABI31_0_0EXModuleClasses;
}

+ (NSSet<ABI31_0_0EXSingletonModule *> *)singletonModules
{
  dispatch_once(&onceSingletonModulesToken, ABI31_0_0EXinitializeGlobalSingletonModulesSet);
  return ABI31_0_0EXSingletonModules;
}

- (ABI31_0_0EXModuleRegistry *)moduleRegistryForExperienceId:(NSString *)experienceId
{
  NSMutableSet<id<ABI31_0_0EXInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<ABI31_0_0EXExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<ABI31_0_0EXViewManager *> *viewManagerModules = [NSMutableSet set];
  
  for (Class klass in [self getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(ABI31_0_0EXInternalModule)]) {
      ABI31_0_0EXLogWarn(@"Registered class `%@` does not conform to the `ABI31_0_0EXModule` protocol.", [klass description]);
      continue;
    }

    id<ABI31_0_0EXInternalModule> instance = [self createModuleInstance:klass forExperienceWithId:experienceId];
    
    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }
    
    if ([instance isKindOfClass:[ABI31_0_0EXExportedModule class]]) {
      [exportedModules addObject:(ABI31_0_0EXExportedModule *)instance];
    }
    
    if ([instance isKindOfClass:[ABI31_0_0EXViewManager class]]) {
      [viewManagerModules addObject:(ABI31_0_0EXViewManager *)instance];
    }
  }
  
  ABI31_0_0EXModuleRegistry *moduleRegistry = [[ABI31_0_0EXModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<ABI31_0_0EXInternalModule>)createModuleInstance:(Class)moduleClass forExperienceWithId:(NSString *)experienceId
{
  id<ABI31_0_0EXInternalModule> instance;
  if ([moduleClass instancesRespondToSelector:@selector(initWithExperienceId:)]) {
    instance = [[moduleClass alloc] initWithExperienceId:experienceId];
  } else {
    instance = [[moduleClass alloc] init];
  }
  return instance;
}

@end
