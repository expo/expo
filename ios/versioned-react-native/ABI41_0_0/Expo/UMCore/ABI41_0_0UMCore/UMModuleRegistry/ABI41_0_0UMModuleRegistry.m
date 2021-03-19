// Copyright © 2018 650 Industries. All rights reserved.

#import <objc/runtime.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistry.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

@interface ABI41_0_0UMModuleRegistry ()

@property (nonatomic, weak) id<ABI41_0_0UMModuleRegistryDelegate> delegate;

@property NSMutableSet<id<ABI41_0_0UMInternalModule>> *internalModulesSet;
@property NSMapTable<Protocol *, id<ABI41_0_0UMInternalModule>> *internalModules;
@property NSMapTable<Protocol *, NSMutableArray<id<ABI41_0_0UMInternalModule>> *> *internalModulesPreResolution;
@property NSMapTable<Class, ABI41_0_0UMExportedModule *> *exportedModulesByClass;
@property NSMutableDictionary<const NSString *, ABI41_0_0UMExportedModule *> *exportedModules;
@property NSMutableDictionary<const NSString *, ABI41_0_0UMViewManager *> *viewManagerModules;
@property NSMutableDictionary<const NSString *, id> *singletonModules;

@property NSPointerArray *registryConsumers;

@end

@implementation ABI41_0_0UMModuleRegistry

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

- (instancetype)initWithInternalModules:(NSSet<id<ABI41_0_0UMInternalModule>> *)internalModules
                        exportedModules:(NSSet<ABI41_0_0UMExportedModule *> *)exportedModules
                           viewManagers:(NSSet<ABI41_0_0UMViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules
{
  if (self = [self init]) {
    for (id<ABI41_0_0UMInternalModule> internalModule in internalModules) {
      [self registerInternalModule:internalModule];
    }
    
    for (ABI41_0_0UMExportedModule *exportedModule in exportedModules) {
      [self registerExportedModule:exportedModule];
    }

    for (ABI41_0_0UMViewManager *viewManager in viewManagers) {
      [self registerViewManager:viewManager];
    }

    for (id singletonModule in singletonModules) {
      [self registerSingletonModule:singletonModule];
    }
  }
  return self;
}

- (void)setDelegate:(id<ABI41_0_0UMModuleRegistryDelegate>)delegate
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
    NSArray<id<ABI41_0_0UMInternalModule>> *conflictingModules = [_internalModulesPreResolution objectForKey:protocol];

    id<ABI41_0_0UMInternalModule> resolvedModule;
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
  for (id<ABI41_0_0UMModuleRegistryConsumer> registryConsumer in _registryConsumers) {
    [registryConsumer setModuleRegistry:self];
  }
}

# pragma mark - Registering modules

- (void)registerInternalModule:(id<ABI41_0_0UMInternalModule>)internalModule
{
  for (Protocol *exportedInterface in [[internalModule class] exportedInterfaces]) {
    if (_internalModules) {
      id<ABI41_0_0UMInternalModule> resolvedModule = internalModule;
      if (_delegate && [_internalModules objectForKey:exportedInterface]) {
        id<ABI41_0_0UMInternalModule> oldModule = [_internalModules objectForKey:exportedInterface];
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

- (void)registerExportedModule:(ABI41_0_0UMExportedModule *)exportedModule
{
  const NSString *exportedModuleName = [[exportedModule class] exportedModuleName];
  if (_exportedModules[exportedModuleName]) {
    ABI41_0_0UMLogInfo(@"Universal module %@ overrides %@ as the module exported as %@.", exportedModule, _exportedModules[exportedModuleName], exportedModuleName);
  }

  _exportedModules[exportedModuleName] = exportedModule;
  [_exportedModulesByClass setObject:exportedModule forKey:[exportedModule class]];
  [self maybeAddRegistryConsumer:exportedModule];
}

- (void)registerViewManager:(ABI41_0_0UMViewManager *)viewManager
{
  const NSString *exportedModuleName = [[viewManager class] exportedModuleName];
  if (_viewManagerModules[exportedModuleName]) {
    ABI41_0_0UMLogInfo(@"Universal view manager %@ overrides %@ as the module exported as %@.", viewManager, _viewManagerModules[exportedModuleName], exportedModuleName);
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
    ABI41_0_0UMLogWarn(@"One of the singleton modules does not respond to +(NSString *)name selector. This probably means you're either try to pass a strange object as a singleton module (it won't get registered in the module registry, sorry) or the ABI41_0_0UMSingletonModule interface and the ABI41_0_0UMModuleRegistry implementations versions are out of sync, which means things will probably not work as expected.");
  }
}

- (void)maybeAddRegistryConsumer:(id)maybeConsumer
{
  if ([maybeConsumer conformsToProtocol:@protocol(ABI41_0_0UMModuleRegistryConsumer)]) {
    [self addRegistryConsumer:(id<ABI41_0_0UMModuleRegistryConsumer>)maybeConsumer];
  }
}

- (void)addRegistryConsumer:(id<ABI41_0_0UMModuleRegistryConsumer>)registryConsumer
{
  [_registryConsumers addPointer:(__bridge void * _Nullable)(registryConsumer)];
}

# pragma mark - Registry API

- (id)getModuleImplementingProtocol:(Protocol *)protocol
{
  [self resolveInternalModulesConflicts];
  return [_internalModules objectForKey:protocol];
}

- (ABI41_0_0UMExportedModule *)getExportedModuleForName:(NSString *)name
{
  return _exportedModules[name];
}

- (ABI41_0_0UMExportedModule *)getExportedModuleOfClass:(Class)moduleClass
{
  return [_exportedModulesByClass objectForKey:moduleClass];
}

- (id)getSingletonModuleForName:(NSString *)singletonModuleName
{
  return [_singletonModules objectForKey:singletonModuleName];
}

- (NSArray<id<ABI41_0_0UMInternalModule>> *)getAllInternalModules
{
  [self resolveInternalModulesConflicts];
  return [_internalModulesSet allObjects];
}

- (NSArray<ABI41_0_0UMExportedModule *> *)getAllExportedModules
{
  return [_exportedModules allValues];
}

- (NSArray<ABI41_0_0UMViewManager *> *)getAllViewManagers
{
  return [_viewManagerModules allValues];
}

- (NSArray *)getAllSingletonModules
{
  return [_singletonModules allValues];
}

@end
