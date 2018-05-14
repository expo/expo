// Copyright © 2018 650 Industries. All rights reserved.

#import <objc/runtime.h>
#import <React/RCTLog.h>
#import <EXCore/EXModule.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistry+Downcasting.h>

static dispatch_once_t onceToken;
static NSMutableSet<Class> *EXModuleClasses;
static NSMutableDictionary<NSString *, Class> *EXInternalModulesNames;
static NSMutableDictionary<NSString *, Class> *EXExportedModulesNames;

void (^initializeGlobalModulesRegistry)(void) = ^{
  EXModuleClasses = [NSMutableSet set];
  EXInternalModulesNames = [NSMutableDictionary dictionary];
  EXExportedModulesNames = [NSMutableDictionary dictionary];
};

extern void EXRegisterInternalModule(Class, NSString *);
extern void EXRegisterInternalModule(Class moduleClass, NSString *internalName)
{
  dispatch_once(&onceToken, initializeGlobalModulesRegistry);
  [EXModuleClasses addObject:moduleClass];
  EXInternalModulesNames[internalName] = moduleClass;
}

extern void EXRegisterExportedModule(Class, NSString *);
extern void EXRegisterExportedModule(Class moduleClass, NSString *exportedName)
{
  dispatch_once(&onceToken, initializeGlobalModulesRegistry);
  [EXModuleClasses addObject:moduleClass];
  EXExportedModulesNames[exportedName] = moduleClass;
}

@interface EXModuleRegistry()

@property NSMutableDictionary<Class, id<EXModule>> *classesInstances;
@property NSMutableDictionary<NSString *, id<EXModule>> *modulesInstances;

@end

@implementation EXModuleRegistry

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _classesInstances = [[NSMutableDictionary alloc] init];
    [EXModuleClasses enumerateObjectsUsingBlock:^(Class  _Nonnull klass, BOOL * _Nonnull stop) {
      if ([klass conformsToProtocol:@protocol(EXModule)]) {
        id<EXModule> instance = [self _createModuleInstance:klass];
        _classesInstances[klass.self] = instance;
      } else {
        // TODO: Should we throw an exception?
        EXLogWarn(@"Exported class `%@` does not conform to the `EXModule` protocol.", [klass description]);
      }
    }];

    // Here we have a fully-populated `_modulesInstances` dictionary.

    // We split instantiation of modules and setting module registry so that all the modules are available
    // at the moment of setting the module registry. Otherwise, module A could decide to ask the registry
    // for module B, which would be instantiated just after module A.
    [_classesInstances enumerateKeysAndObjectsUsingBlock:^(Class  _Nonnull key, id  _Nonnull instance, BOOL * _Nonnull stop) {
      if ([instance respondsToSelector:@selector(setModuleRegistry:)]) {
        [instance setModuleRegistry:self];
      }
    }];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (id<EXModule>)getModuleForName:(NSString *)name
{
  return _classesInstances[EXInternalModulesNames[name]];
}

- (id)createModuleForName:(NSString *)name downcastedTo:(Protocol *)protocol exception:(NSException * __autoreleasing *)outException
{
  id instance = [[EXInternalModulesNames[name] alloc] init];
  if (instance) {
    if ([instance respondsToSelector:@selector(setModuleRegistry:)]) {
      [instance setModuleRegistry:self];
    }
    [self _downcastInstance:instance toProtocol:protocol exception:outException];
  }
  return instance;
}

- (id<EXModule>)getExportedModuleForName:(NSString *)name
{
  return _classesInstances[EXExportedModulesNames[name]];
}

- (id)getModuleForName:(NSString *)name downcastedTo:(Protocol *)protocol exception:(NSException * __autoreleasing *)outException
{
  id<EXModule> instance = [self getModuleForName:name];
  if (instance) {
    [self _downcastInstance:instance toProtocol:protocol exception:outException];
  }
  return instance;
}

- (NSArray<id<EXModule>> *)getAllModules
{
  return [_classesInstances allValues];
}

# pragma mark - Utilities

- (id<EXModule>)_createModuleInstance:(Class)moduleClass
{
  id<EXModule> instance;
  if ([moduleClass instancesRespondToSelector:@selector(initWithExperienceId:)]) {
    instance = [[moduleClass alloc] initWithExperienceId:_experienceId];
  } else {
    instance = [[moduleClass alloc] init];
  }
  return instance;
}

- (id<EXModule>)_downcastInstance:(id<EXModule>)instance toProtocol:(Protocol *)protocol exception:(NSException * __autoreleasing *)outException
{
  @try {
    [self downcastInstance:instance toProtocol:protocol];
    return instance;
  }
  @catch (NSException *exception) {
    if (outException) {
      *outException = exception;
    } else {
      RCTLogWarn(@"Downcasting exception is being ignored: %@.", exception);
    }
    return nil;
  }
}

@end
