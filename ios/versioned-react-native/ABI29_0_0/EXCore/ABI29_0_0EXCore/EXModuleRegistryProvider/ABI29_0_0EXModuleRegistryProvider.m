// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXSingletonModule.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistryProvider.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *ABI29_0_0EXModuleClasses;

void (^ABI29_0_0EXinitializeGlobalModulesRegistry)(void) = ^{
  ABI29_0_0EXModuleClasses = [NSMutableSet set];
};

extern void ABI29_0_0EXRegisterModule(Class);
extern void ABI29_0_0EXRegisterModule(Class moduleClass)
{
  dispatch_once(&onceToken, ABI29_0_0EXinitializeGlobalModulesRegistry);
  [ABI29_0_0EXModuleClasses addObject:moduleClass];
}

@interface ABI29_0_0EXModuleRegistryProvider ()

@property (nonatomic, strong) NSMutableSet<Class> *singletonModuleClasses;

@end

@implementation ABI29_0_0EXModuleRegistryProvider

- (instancetype)initWithSingletonModuleClasses:(NSSet *)moduleClasses
{
  if (self = [super init]) {
    _singletonModuleClasses = [NSMutableSet set];
    for (Class klass in moduleClasses) {
      [_singletonModuleClasses addObject:klass];
    }
  }
  return self;
}

- (NSSet<Class> *)getModulesClasses
{
  return ABI29_0_0EXModuleClasses;
}

- (ABI29_0_0EXModuleRegistry *)moduleRegistryForExperienceId:(NSString *)experienceId
{
  NSMutableSet<id<ABI29_0_0EXInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<ABI29_0_0EXExportedModule *> *exportedModules = [NSMutableSet set];
  NSMutableSet<ABI29_0_0EXViewManager *> *viewManagerModules = [NSMutableSet set];
  NSMutableSet<ABI29_0_0EXSingletonModule *> *singletonModules = [NSMutableSet set];
 
  // we can't wrap these in the ABI29_0_0EXRegisterModule macro because we want this hook to be robust to vendoring/versioning
  for (Class klass in _singletonModuleClasses) {
    ABI29_0_0EXSingletonModule *singletonModuleInstance = [[klass class] sharedInstance];
    [singletonModules addObject:singletonModuleInstance];
    continue;
  }
  
  for (Class klass in [self getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(ABI29_0_0EXInternalModule)]) {
      ABI29_0_0EXLogWarn(@"Registered class `%@` does not conform to the `ABI29_0_0EXModule` protocol.", [klass description]);
      continue;
    }

    id<ABI29_0_0EXInternalModule> instance = [self createModuleInstance:klass forExperienceWithId:experienceId];
    
    if ([[instance class] exportedInterfaces] != nil && [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }
    
    if ([instance isKindOfClass:[ABI29_0_0EXExportedModule class]]) {
      [exportedModules addObject:(ABI29_0_0EXExportedModule *)instance];
    }
    
    if ([instance isKindOfClass:[ABI29_0_0EXViewManager class]]) {
      [viewManagerModules addObject:(ABI29_0_0EXViewManager *)instance];
    }
  }
  
  ABI29_0_0EXModuleRegistry *moduleRegistry = [[ABI29_0_0EXModuleRegistry alloc] initWithInternalModules:internalModules
                                                                       exportedModules:exportedModules
                                                                          viewManagers:viewManagerModules
                                                                      singletonModules:singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

# pragma mark - Utilities

- (id<ABI29_0_0EXInternalModule>)createModuleInstance:(Class)moduleClass forExperienceWithId:(NSString *)experienceId
{
  id<ABI29_0_0EXInternalModule> instance;
  if ([moduleClass instancesRespondToSelector:@selector(initWithExperienceId:)]) {
    instance = [[moduleClass alloc] initWithExperienceId:experienceId];
  } else {
    instance = [[moduleClass alloc] init];
  }
  return instance;
}

@end
