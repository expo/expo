// Copyright © 2018 650 Industries. All rights reserved.

#import <objc/runtime.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistry.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

@interface ABI43_0_0EXModuleRegistry ()

@property (nonatomic, weak) id<ABI43_0_0EXModuleRegistryDelegate> delegate;

@property NSMutableSet<id<ABI43_0_0EXInternalModule>> *internalModulesSet;
@property NSMapTable<Protocol *, id<ABI43_0_0EXInternalModule>> *internalModules;
@property NSMapTable<Protocol *, NSMutableArray<id<ABI43_0_0EXInternalModule>> *> *internalModulesPreResolution;
@property NSMapTable<Class, ABI43_0_0EXExportedModule *> *exportedModulesByClass;
@property NSMutableDictionary<const NSString *, ABI43_0_0EXExportedModule *> *exportedModules;
@property NSMutableDictionary<const NSString *, ABI43_0_0EXViewManager *> *viewManagerModules;
@property NSMutableDictionary<const NSString *, id> *singletonModules;

@property NSPointerArray *registryConsumers;

@end

@implementation ABI43_0_0EXModuleRegistry

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

- (instancetype)initWithInternalModules:(NSSet<id<ABI43_0_0EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<ABI43_0_0EXExportedModule *> *)exportedModules
                           viewManagers:(NSSet<ABI43_0_0EXViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules
{
  if (self = [self init]) {
    for (id<ABI43_0_0EXInternalModule> internalModule in internalModules) {
      [self registerInternalModule:internalModule];
    }
    
    for (ABI43_0_0EXExportedModule *exportedModule in exportedModules) {
      [self registerExportedModule:exportedModule];
    }

    for (ABI43_0_0EXViewManager *viewManager in viewManagers) {
      [self registerViewManager:viewManager];
    }

    for (id singletonModule in singletonModules) {
      [self registerSingletonModule:singletonModule];
    }
  }
  return self;
}

- (void)setDelegate:(id<ABI43_0_0EXModuleRegistryDelegate>)delegate
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
    NSArray<id<ABI43_0_0EXInternalModule>> *conflictingModules = [_internalModulesPreResolution objectForKey:protocol];

    id<ABI43_0_0EXInternalModule> resolvedModule;
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
  for (id<ABI43_0_0EXModuleRegistryConsumer> registryConsumer in _registryConsumers) {
    [registryConsumer setModuleRegistry:self];
  }
}

# pragma mark - Registering modules

- (void)registerInternalModule:(id<ABI43_0_0EXInternalModule>)internalModule
{
  for (Protocol *exportedInterface in [[internalModule class] exportedInterfaces]) {
    if (_internalModules) {
      id<ABI43_0_0EXInternalModule> resolvedModule = internalModule;
      if (_delegate && [_internalModules objectForKey:exportedInterface]) {
        id<ABI43_0_0EXInternalModule> oldModule = [_internalModules objectForKey:exportedInterface];
        resolvedModule = [_delegate pickInternalModuleImplementingInterface:exportedInterface fromAmongModules:@[oldModule, internalModule]];
      }
      [_internalModules setObject:resolvedModule forKey:exportedInterface];
      [self maybeAddRegistryConsumer:resolvedModule];
      [_internalModulesSet addObject:resolvedModule];
    } else {
      if (![_internalModulesPreResolution objectForKey:exportedInterface]) {
        [_internalModulesPreResolution setObject:[NSMutableArray array] forKey:exportedInterface];
      }

      [[_internalModulesPreResolution objectForKey:exportedInterface] addObject:internalModule];
    }
  }
}

- (void)registerExportedModule:(ABI43_0_0EXExportedModule *)exportedModule
{
  const NSString *exportedModuleName = [[exportedModule class] exportedModuleName];
  if (_exportedModules[exportedModuleName]) {
    ABI43_0_0EXLogInfo(@"Module %@ overrides %@ as the module exported as %@.", exportedModule, _exportedModules[exportedModuleName], exportedModuleName);
  }

  _exportedModules[exportedModuleName] = exportedModule;
  [_exportedModulesByClass setObject:exportedModule forKey:[exportedModule class]];
  [self maybeAddRegistryConsumer:exportedModule];
}

- (void)registerViewManager:(ABI43_0_0EXViewManager *)viewManager
{
  const NSString *exportedModuleName = [[viewManager class] exportedModuleName];
  if (_viewManagerModules[exportedModuleName]) {
    ABI43_0_0EXLogInfo(@"View manager %@ overrides %@ as the module exported as %@.", viewManager, _viewManagerModules[exportedModuleName], exportedModuleName);
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
    ABI43_0_0EXLogWarn(@"One of the singleton modules does not respond to +(NSString *)name selector. This probably means you're either try to pass a strange object as a singleton module (it won't get registered in the module registry, sorry) or the ABI43_0_0EXSingletonModule interface and the ABI43_0_0EXModuleRegistry implementations versions are out of sync, which means things will probably not work as expected.");
  }
}

- (void)maybeAddRegistryConsumer:(id)maybeConsumer
{
  if ([maybeConsumer conformsToProtocol:@protocol(ABI43_0_0EXModuleRegistryConsumer)]) {
    [self addRegistryConsumer:(id<ABI43_0_0EXModuleRegistryConsumer>)maybeConsumer];
  }
}

- (void)addRegistryConsumer:(id<ABI43_0_0EXModuleRegistryConsumer>)registryConsumer
{
  void *ptr = (__bridge void * _Nullable)registryConsumer;

  for (id consumerPtr in _registryConsumers) {
    if (consumerPtr == ptr) {
      return;
    }
  }
  [_registryConsumers addPointer:ptr];
}

# pragma mark - Registry API

- (id)getModuleImplementingProtocol:(Protocol *)protocol
{
  [self resolveInternalModulesConflicts];
  return [_internalModules objectForKey:protocol];
}

- (ABI43_0_0EXExportedModule *)getExportedModuleForName:(NSString *)name
{
  return _exportedModules[name];
}

- (ABI43_0_0EXExportedModule *)getExportedModuleOfClass:(Class)moduleClass
{
  return [_exportedModulesByClass objectForKey:moduleClass];
}

- (id)getSingletonModuleForName:(NSString *)singletonModuleName
{
  return [_singletonModules objectForKey:singletonModuleName];
}

- (NSArray<id<ABI43_0_0EXInternalModule>> *)getAllInternalModules
{
  [self resolveInternalModulesConflicts];
  return [_internalModulesSet allObjects];
}

- (NSArray<ABI43_0_0EXExportedModule *> *)getAllExportedModules
{
  return [_exportedModules allValues];
}

- (NSArray<ABI43_0_0EXViewManager *> *)getAllViewManagers
{
  return [_viewManagerModules allValues];
}

- (NSArray *)getAllSingletonModules
{
  return [_singletonModules allValues];
}

@end
