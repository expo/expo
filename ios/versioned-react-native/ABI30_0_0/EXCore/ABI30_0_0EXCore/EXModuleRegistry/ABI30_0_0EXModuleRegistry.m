// Copyright © 2018 650 Industries. All rights reserved.

#import <objc/runtime.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistry.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>

@interface ABI30_0_0EXModuleRegistry ()

@property (nonatomic, weak) id<ABI30_0_0EXModuleRegistryDelegate> delegate;

@property NSMutableSet<id<ABI30_0_0EXInternalModule>> *internalModulesSet;
@property NSMapTable<Protocol *, id<ABI30_0_0EXInternalModule>> *internalModules;
@property NSMapTable<Protocol *, NSMutableArray<id<ABI30_0_0EXInternalModule>> *> *internalModulesPreResolution;
@property NSMutableDictionary<Class, ABI30_0_0EXExportedModule *> *exportedModulesByClass;
@property NSMutableDictionary<const NSString *, ABI30_0_0EXExportedModule *> *exportedModules;
@property NSMutableDictionary<const NSString *, ABI30_0_0EXViewManager *> *viewManagerModules;
@property NSMutableDictionary<const NSString *, id> *singletonModules;

@property NSMutableSet<id<ABI30_0_0EXModuleRegistryConsumer>> *registryConsumers;

@end

@implementation ABI30_0_0EXModuleRegistry

# pragma mark - Lifecycle

- (instancetype)init
{
  if (self = [super init]) {
    _internalModulesSet = [NSMutableSet set];
    _internalModulesPreResolution = [NSMapTable weakToStrongObjectsMapTable];
    _exportedModulesByClass = [NSMutableDictionary dictionary];
    _exportedModules = [NSMutableDictionary dictionary];
    _viewManagerModules = [NSMutableDictionary dictionary];
    _singletonModules = [NSMutableDictionary dictionary];
    _registryConsumers = [NSMutableSet set];
  }
  return self;
}

- (instancetype)initWithInternalModules:(NSSet<id<ABI30_0_0EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<ABI30_0_0EXExportedModule *> *)exportedModules
                           viewManagers:(NSSet<ABI30_0_0EXViewManager *> *)viewManagers
                       singletonModules:(NSSet *)singletonModules
{
  if (self = [self init]) {
    for (id<ABI30_0_0EXInternalModule> internalModule in internalModules) {
      [self registerInternalModule:internalModule];
    }
    
    for (ABI30_0_0EXExportedModule *exportedModule in exportedModules) {
      [self registerExportedModule:exportedModule];
    }

    for (ABI30_0_0EXViewManager *viewManager in viewManagers) {
      [self registerViewManager:viewManager];
    }

    for (id singletonModule in singletonModules) {
      [self registerSingletonModule:singletonModule];
    }
  }
  return self;
}

- (void)setDelegate:(id<ABI30_0_0EXModuleRegistryDelegate>)delegate
{
  _delegate = delegate;
}

- (void)resolveInternalModulesConflicts
{
  _internalModules = [NSMapTable weakToStrongObjectsMapTable];
  for (Protocol *protocol in _internalModulesPreResolution) {
    NSArray<id<ABI30_0_0EXInternalModule>> *conflictingModules = [_internalModulesPreResolution objectForKey:protocol];

    if ([conflictingModules count] > 1 && _delegate) {
      id<ABI30_0_0EXInternalModule> resolvedModule = [_delegate pickInternalModuleImplementingInterface:protocol fromAmongModules:conflictingModules];
      [_internalModules setObject:resolvedModule forKey:protocol];
    } else {
      [_internalModules setObject:[conflictingModules lastObject] forKey:protocol];
    }
  }
}

- (void)initialize
{
  [self resolveInternalModulesConflicts];
  for (id<ABI30_0_0EXModuleRegistryConsumer> registryConsumer in _registryConsumers) {
    [registryConsumer setModuleRegistry:self];
  }
}

# pragma mark - Registering modules

- (void)registerInternalModule:(id<ABI30_0_0EXInternalModule>)internalModule
{
  for (Protocol *exportedInterface in [[internalModule class] exportedInterfaces]) {
    if (![_internalModulesPreResolution objectForKey:exportedInterface]) {
      [_internalModulesPreResolution setObject:[NSMutableArray array] forKey:exportedInterface];
    }

    [[_internalModulesPreResolution objectForKey:exportedInterface] addObject:internalModule];
  }

  [_internalModulesSet addObject:internalModule];
  [self maybeAddRegistryConsumer:internalModule];
}

- (id<ABI30_0_0EXInternalModule>)unregisterInternalModuleForProtocol:(Protocol *)protocol
{
  id<ABI30_0_0EXInternalModule> module = [_internalModules objectForKey:protocol];
  [_internalModulesSet removeObject:module];
  [_internalModules removeObjectForKey:protocol];
  return module;
}

- (void)registerExportedModule:(ABI30_0_0EXExportedModule *)exportedModule
{
  const NSString *exportedModuleName = [[exportedModule class] exportedModuleName];
  if (_exportedModules[exportedModuleName]) {
    ABI30_0_0EXLogWarn(@"Expo module %@ overrides %@ as the module exported as %@.", exportedModule, _exportedModules[exportedModuleName], exportedModuleName);
  }

  _exportedModules[exportedModuleName] = exportedModule;
  [_exportedModulesByClass setObject:exportedModule forKey:(id<NSCopying>)[exportedModule class]];
  [self maybeAddRegistryConsumer:exportedModule];
}

- (void)registerViewManager:(ABI30_0_0EXViewManager *)viewManager
{
  const NSString *exportedModuleName = [[viewManager class] exportedModuleName];
  if (_viewManagerModules[exportedModuleName]) {
    ABI30_0_0EXLogWarn(@"Expo view manager %@ overrides %@ as the module exported as %@.", viewManager, _viewManagerModules[exportedModuleName], exportedModuleName);
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
    ABI30_0_0EXLogWarn(@"One of the singleton modules does not respond to +(NSString *)name selector. This probably means you're either try to pass a strange object as a singleton module (it won't get registered in the module registry, sorry) or the ABI30_0_0EXSingletonModule interface and the ABI30_0_0EXModuleRegistry implementations versions are out of sync, which means things will probably not work as expected.");
  }
}

- (void)maybeAddRegistryConsumer:(id)maybeConsumer
{
  if ([maybeConsumer conformsToProtocol:@protocol(ABI30_0_0EXModuleRegistryConsumer)]) {
    [self addRegistryConsumer:(id<ABI30_0_0EXModuleRegistryConsumer>)maybeConsumer];
  }
}

- (void)addRegistryConsumer:(id<ABI30_0_0EXModuleRegistryConsumer>)registryConsumer
{
  [_registryConsumers addObject:registryConsumer];
}

# pragma mark - Registry API

- (id)getModuleImplementingProtocol:(Protocol *)protocol
{
  return [_internalModules objectForKey:protocol];
}

- (ABI30_0_0EXExportedModule *)getExportedModuleForName:(NSString *)name
{
  return _exportedModules[name];
}

- (ABI30_0_0EXExportedModule *)getExportedModuleOfClass:(Class)moduleClass
{
  return [_exportedModulesByClass objectForKey:moduleClass];
}

- (id)getSingletonModuleForName:(NSString *)singletonModuleName
{
  return [_singletonModules objectForKey:singletonModuleName];
}

- (NSArray<id<ABI30_0_0EXInternalModule>> *)getAllInternalModules
{
  return [_internalModulesSet allObjects];
}

- (NSArray<ABI30_0_0EXExportedModule *> *)getAllExportedModules
{
  return [_exportedModules allValues];
}

- (NSArray<ABI30_0_0EXViewManager *> *)getAllViewManagers
{
  return [_viewManagerModules allValues];
}

- (NSArray *)getAllSingletonModules
{
  return [_singletonModules allValues];
}

@end
