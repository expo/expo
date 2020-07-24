// Copyright © 2018 650 Industries. All rights reserved.

#import <objc/runtime.h>
#import <EDUMModuleRegistry.h>
#import <EDUMModuleRegistryConsumer.h>

@interface EDUMModuleRegistry ()

@property (nonatomic, weak) id<EDUMModuleRegistryDelegate> delegate;

@property NSMutableSet<id<EDUMInternalModule>> *internalModulesSet;
@property NSMapTable<Protocol *, id<EDUMInternalModule>> *internalModules;
@property NSMapTable<Protocol *, NSMutableArray<id<EDUMInternalModule>> *> *internalModulesPreResolution;
@property NSMapTable<Class, EDUMExportedModule *> *exportedModulesByClass;
@property NSMutableDictionary<const NSString *, EDUMExportedModule *> *exportedModules;
@property NSMutableDictionary<const NSString *, EDUMViewManager *> *viewManagerModules;
@property NSMutableDictionary<const NSString *, id> *singletonModules;

@property NSPointerArray *registryConsumers;

@end

@implementation EDUMModuleRegistry

# pragma mark - Lifecycle

- (instancetype)init
{
  if (self = [super init]) {
    _internalModulesPreResolution = [NSMapTable weakToStrongObjectsMapTable];
    _exportedModulesByClass = [NSMapTable weakToWeakObjectsMapTable];
    _exportedModules = [NSMutableDictionary dictionary];
    _viewManagerModules = [NSMutableDictionary dictionary];
    _singletonModules = [NSMutableDictionary dictionary];
    _registryConsumers = [NSPointerArray weakObjectsPointerArray];
  }
  return self;
}

- (instancetype)initWithInternalModules:(NSSet<id<EDUMInternalModule>> *)internalModules
                        exportedModules:(NSSet<EDUMExportedModule *> *)exportedModules
                           viewManagers:(NSSet<EDUMViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules
{
  if (self = [self init]) {
    for (id<EDUMInternalModule> internalModule in internalModules) {
      [self registerInternalModule:internalModule];
    }
    
    for (EDUMExportedModule *exportedModule in exportedModules) {
      [self registerExportedModule:exportedModule];
    }

    for (EDUMViewManager *viewManager in viewManagers) {
      [self registerViewManager:viewManager];
    }

    for (id singletonModule in singletonModules) {
      [self registerSingletonModule:singletonModule];
    }
  }
  return self;
}

- (void)setDelegate:(id<EDUMModuleRegistryDelegate>)delegate
{
  _delegate = delegate;
}

// Fills in _internalModules and _internalModulesSet
- (void)resolveInternalModulesConflicts
{
  if (_internalModules) {
    // Conflict resolution has already been completed.
    return;
  }

  _internalModules = [NSMapTable weakToStrongObjectsMapTable];
  _internalModulesSet = [NSMutableSet new];
  for (Protocol *protocol in _internalModulesPreResolution) {
    NSArray<id<EDUMInternalModule>> *conflictingModules = [_internalModulesPreResolution objectForKey:protocol];

    id<EDUMInternalModule> resolvedModule;
    if ([conflictingModules count] > 1 && _delegate) {
      resolvedModule = [_delegate pickInternalModuleImplementingInterface:protocol fromAmongModules:conflictingModules];
    } else {
      resolvedModule = [conflictingModules lastObject];
    }

    [_internalModules setObject:resolvedModule forKey:protocol];
    [self maybeAddRegistryConsumer:resolvedModule];
    [_internalModulesSet addObject:resolvedModule];
  }

  _internalModulesPreResolution = nil; // Remove references to discarded modules
}

- (void)initialize
{
  [self resolveInternalModulesConflicts];
  for (id<EDUMModuleRegistryConsumer> registryConsumer in _registryConsumers) {
    [registryConsumer setModuleRegistry:self];
  }
}

# pragma mark - Registering modules

- (void)registerInternalModule:(id<EDUMInternalModule>)internalModule
{
  for (Protocol *exportedInterface in [[internalModule class] exportedInterfaces]) {
    if (_internalModules) {
      id<EDUMInternalModule> resolvedModule = internalModule;
      if (_delegate && [_internalModules objectForKey:exportedInterface]) {
        id<EDUMInternalModule> oldModule = [_internalModules objectForKey:exportedInterface];
        resolvedModule = [_delegate pickInternalModuleImplementingInterface:exportedInterface fromAmongModules:@[oldModule, internalModule]];
      }
      [_internalModules setObject:resolvedModule forKey:exportedInterface];
      [_internalModulesSet addObject:resolvedModule];
    } else {
      if (![_internalModulesPreResolution objectForKey:exportedInterface]) {
        [_internalModulesPreResolution setObject:[NSMutableArray array] forKey:exportedInterface];
      }

      [[_internalModulesPreResolution objectForKey:exportedInterface] addObject:internalModule];
    }
  }
}

- (void)registerExportedModule:(EDUMExportedModule *)exportedModule
{
  const NSString *exportedModuleName = [[exportedModule class] exportedModuleName];
  if (_exportedModules[exportedModuleName]) {
    EDUMLogInfo(@"Universal module %@ overrides %@ as the module exported as %@.", exportedModule, _exportedModules[exportedModuleName], exportedModuleName);
  }

  _exportedModules[exportedModuleName] = exportedModule;
  [_exportedModulesByClass setObject:exportedModule forKey:[exportedModule class]];
  [self maybeAddRegistryConsumer:exportedModule];
}

- (void)registerViewManager:(EDUMViewManager *)viewManager
{
  const NSString *exportedModuleName = [[viewManager class] exportedModuleName];
  if (_viewManagerModules[exportedModuleName]) {
    EDUMLogInfo(@"Universal view manager %@ overrides %@ as the module exported as %@.", viewManager, _viewManagerModules[exportedModuleName], exportedModuleName);
  }

  _viewManagerModules[exportedModuleName] = viewManager;
  [self maybeAddRegistryConsumer:viewManager];
}

- (void)registerSingletonModule:(id)singletonModule
{
  if ([[singletonModule class] respondsToSelector:@selector(name)]) {
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wobjc-method-access"
    [_singletonModules setObject:singletonModule forKey:[[singletonModule class] name]];
    #pragma clang diagnostic pop
  } else {
    EDUMLogWarn(@"One of the singleton modules does not respond to +(NSString *)name selector. This probably means you're either try to pass a strange object as a singleton module (it won't get registered in the module registry, sorry) or the EDUMSingletonModule interface and the EDUMModuleRegistry implementations versions are out of sync, which means things will probably not work as expected.");
  }
}

- (void)maybeAddRegistryConsumer:(id)maybeConsumer
{
  if ([maybeConsumer conformsToProtocol:@protocol(EDUMModuleRegistryConsumer)]) {
    [self addRegistryConsumer:(id<EDUMModuleRegistryConsumer>)maybeConsumer];
  }
}

- (void)addRegistryConsumer:(id<EDUMModuleRegistryConsumer>)registryConsumer
{
  [_registryConsumers addPointer:(__bridge void * _Nullable)(registryConsumer)];
}

# pragma mark - Registry API

- (id)getModuleImplementingProtocol:(Protocol *)protocol
{
  [self resolveInternalModulesConflicts];
  return [_internalModules objectForKey:protocol];
}

- (EDUMExportedModule *)getExportedModuleForName:(NSString *)name
{
  return _exportedModules[name];
}

- (EDUMExportedModule *)getExportedModuleOfClass:(Class)moduleClass
{
  return [_exportedModulesByClass objectForKey:moduleClass];
}

- (id)getSingletonModuleForName:(NSString *)singletonModuleName
{
  return [_singletonModules objectForKey:singletonModuleName];
}

- (NSArray<id<EDUMInternalModule>> *)getAllInternalModules
{
  [self resolveInternalModulesConflicts];
  return [_internalModulesSet allObjects];
}

- (NSArray<EDUMExportedModule *> *)getAllExportedModules
{
  return [_exportedModules allValues];
}

- (NSArray<EDUMViewManager *> *)getAllViewManagers
{
  return [_viewManagerModules allValues];
}

- (NSArray *)getAllSingletonModules
{
  return [_singletonModules allValues];
}

@end
