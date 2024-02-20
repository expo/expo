// Copyright © 2018 650 Industries. All rights reserved.

#import <objc/runtime.h>

#import <ExpoModulesCore/EXModuleRegistry.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/Swift.h>

@interface EXModuleRegistry ()

@property (nonatomic, weak) id<EXModuleRegistryDelegate> delegate;

@property NSMutableSet<id<EXInternalModule>> *internalModulesSet;
@property NSMapTable<Protocol *, id<EXInternalModule>> *internalModules;
@property NSMapTable<Protocol *, NSMutableArray<id<EXInternalModule>> *> *internalModulesPreResolution;
@property NSMapTable<Class, EXExportedModule *> *exportedModulesByClass;
@property NSMutableDictionary<const NSString *, EXExportedModule *> *exportedModules;
@property NSMutableDictionary<const NSString *, id> *singletonModules;

@property NSPointerArray *registryConsumers;

@end

@implementation EXModuleRegistry

# pragma mark - Lifecycle

- (instancetype)init
{
  if (self = [super init]) {
    _internalModulesPreResolution = [NSMapTable weakToStrongObjectsMapTable];
    _exportedModulesByClass = [NSMapTable weakToWeakObjectsMapTable];
    _exportedModules = [NSMutableDictionary dictionary];
    _singletonModules = [NSMutableDictionary dictionary];
    _registryConsumers = [NSPointerArray weakObjectsPointerArray];
  }
  return self;
}

- (instancetype)initWithInternalModules:(NSSet<id<EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<EXExportedModule *> *)exportedModules
                       singletonModules:(NSSet *)singletonModules
{
  if (self = [self init]) {
    for (id<EXInternalModule> internalModule in internalModules) {
      [self registerInternalModule:internalModule];
    }
    
    for (EXExportedModule *exportedModule in exportedModules) {
      [self registerExportedModule:exportedModule];
    }

    for (id singletonModule in singletonModules) {
      [self registerSingletonModule:singletonModule];
    }
  }
  return self;
}

- (void)setDelegate:(id<EXModuleRegistryDelegate>)delegate
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
    NSArray<id<EXInternalModule>> *conflictingModules = [_internalModulesPreResolution objectForKey:protocol];

    id<EXInternalModule> resolvedModule;
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
  for (id<EXModuleRegistryConsumer> registryConsumer in _registryConsumers) {
    [registryConsumer setModuleRegistry:self];
  }
}

# pragma mark - Registering modules

- (void)registerInternalModule:(id<EXInternalModule>)internalModule
{
  for (Protocol *exportedInterface in [[internalModule class] exportedInterfaces]) {
    if (_internalModules) {
      id<EXInternalModule> resolvedModule = internalModule;
      if (_delegate && [_internalModules objectForKey:exportedInterface]) {
        id<EXInternalModule> oldModule = [_internalModules objectForKey:exportedInterface];
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

- (void)registerExportedModule:(EXExportedModule *)exportedModule
{
  const NSString *exportedModuleName = [[exportedModule class] exportedModuleName];
  if (_exportedModules[exportedModuleName]) {
    EXLogInfo(@"Module %@ overrides %@ as the module exported as %@.", exportedModule, _exportedModules[exportedModuleName], exportedModuleName);
  }

  _exportedModules[exportedModuleName] = exportedModule;
  [_exportedModulesByClass setObject:exportedModule forKey:[exportedModule class]];
  [self maybeAddRegistryConsumer:exportedModule];
}

- (void)registerSingletonModule:(id)singletonModule
{
  if ([[singletonModule class] respondsToSelector:@selector(name)]) {
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wobjc-method-access"
    [_singletonModules setObject:singletonModule forKey:[[singletonModule class] name]];
    #pragma clang diagnostic pop
  } else {
    EXLogWarn(@"One of the singleton modules does not respond to +(NSString *)name selector. This probably means you're either try to pass a strange object as a singleton module (it won't get registered in the module registry, sorry) or the EXSingletonModule interface and the EXModuleRegistry implementations versions are out of sync, which means things will probably not work as expected.");
  }
}

- (void)maybeAddRegistryConsumer:(id)maybeConsumer
{
  if ([maybeConsumer conformsToProtocol:@protocol(EXModuleRegistryConsumer)]) {
    [self addRegistryConsumer:(id<EXModuleRegistryConsumer>)maybeConsumer];
  }
}

- (void)addRegistryConsumer:(id<EXModuleRegistryConsumer>)registryConsumer
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

- (EXExportedModule *)getExportedModuleForName:(NSString *)name
{
  return _exportedModules[name];
}

- (EXExportedModule *)getExportedModuleOfClass:(Class)moduleClass
{
  return [_exportedModulesByClass objectForKey:moduleClass];
}

- (id)getSingletonModuleForName:(NSString *)singletonModuleName
{
  return [_singletonModules objectForKey:singletonModuleName];
}

- (NSArray<id<EXInternalModule>> *)getAllInternalModules
{
  [self resolveInternalModulesConflicts];
  return [_internalModulesSet allObjects];
}

- (NSArray<EXExportedModule *> *)getAllExportedModules
{
  return [_exportedModules allValues];
}

- (NSArray *)getAllSingletonModules
{
  return [_singletonModules allValues];
}

@end
