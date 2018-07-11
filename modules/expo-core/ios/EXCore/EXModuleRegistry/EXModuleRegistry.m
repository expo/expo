// Copyright © 2018 650 Industries. All rights reserved.

#import <objc/runtime.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXSingletonModule.h>

@interface EXModuleRegistry ()

@property (nonatomic, weak) id<EXModuleRegistryDelegate> delegate;

@property NSMutableSet<id<EXInternalModule>> *internalModulesSet;
@property NSMapTable<Protocol *, id<EXInternalModule>> *internalModules;
@property NSMapTable<Protocol *, NSMutableArray<id<EXInternalModule>> *> *internalModulesPreResolution;
@property NSMutableDictionary<Class, EXExportedModule *> *exportedModulesByClass;
@property NSMutableDictionary<const NSString *, EXExportedModule *> *exportedModules;
@property NSMutableDictionary<const NSString *, EXViewManager *> *viewManagerModules;
@property NSMutableDictionary<const NSString *, EXSingletonModule *> *singletonModules;

@property NSMutableSet<id<EXModuleRegistryConsumer>> *registryConsumers;

@end

@implementation EXModuleRegistry

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

- (instancetype)initWithInternalModules:(NSSet<id<EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<EXExportedModule *> *)exportedModules
                           viewManagers:(NSSet<EXViewManager *> *)viewManagers
                       singletonModules:(NSSet<EXSingletonModule *> *)singletonModules
{
  if (self = [self init]) {
    for (id<EXInternalModule> internalModule in internalModules) {
      [self registerInternalModule:internalModule];
    }
    
    for (EXExportedModule *exportedModule in exportedModules) {
      [self registerExportedModule:exportedModule];
    }

    for (EXViewManager *viewManager in viewManagers) {
      [self registerViewManager:viewManager];
    }

    for (EXSingletonModule *singletonModule in singletonModules) {
      [self registerSingletonModule:singletonModule];
    }
  }
  return self;
}

- (void)setDelegate:(id<EXModuleRegistryDelegate>)delegate
{
  _delegate = delegate;
}

- (void)resolveInternalModulesConflicts
{
  _internalModules = [NSMapTable weakToStrongObjectsMapTable];
  for (Protocol *protocol in _internalModulesPreResolution) {
    NSArray<id<EXInternalModule>> *conflictingModules = [_internalModulesPreResolution objectForKey:protocol];

    if ([conflictingModules count] > 1 && _delegate) {
      id<EXInternalModule> resolvedModule = [_delegate pickInternalModuleImplementingInterface:protocol fromAmongModules:conflictingModules];
      [_internalModules setObject:resolvedModule forKey:protocol];
    } else {
      [_internalModules setObject:[conflictingModules lastObject] forKey:protocol];
    }
  }
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
    if (![_internalModulesPreResolution objectForKey:exportedInterface]) {
      [_internalModulesPreResolution setObject:[NSMutableArray array] forKey:exportedInterface];
    }

    [[_internalModulesPreResolution objectForKey:exportedInterface] addObject:internalModule];
  }

  [_internalModulesSet addObject:internalModule];
  [self maybeAddRegistryConsumer:internalModule];
}

- (id<EXInternalModule>)unregisterInternalModuleForProtocol:(Protocol *)protocol
{
  id<EXInternalModule> module = [_internalModules objectForKey:protocol];
  [_internalModulesSet removeObject:module];
  [_internalModules removeObjectForKey:protocol];
  return module;
}

- (void)registerExportedModule:(EXExportedModule *)exportedModule
{
  const NSString *exportedModuleName = [[exportedModule class] exportedModuleName];
  if (_exportedModules[exportedModuleName]) {
    EXLogWarn(@"Expo module %@ overrides %@ as the module exported as %@.", exportedModule, _exportedModules[exportedModuleName], exportedModuleName);
  }

  _exportedModules[exportedModuleName] = exportedModule;
  [_exportedModulesByClass setObject:exportedModule forKey:(id<NSCopying>)[exportedModule class]];
  [self maybeAddRegistryConsumer:exportedModule];
}

- (void)registerViewManager:(EXViewManager *)viewManager
{
  const NSString *exportedModuleName = [[viewManager class] exportedModuleName];
  if (_viewManagerModules[exportedModuleName]) {
    EXLogWarn(@"Expo view manager %@ overrides %@ as the module exported as %@.", viewManager, _viewManagerModules[exportedModuleName], exportedModuleName);
  }

  _viewManagerModules[exportedModuleName] = viewManager;
  [self maybeAddRegistryConsumer:viewManager];
}

- (void)registerSingletonModule:(EXSingletonModule *)singletonModule
{
  [_singletonModules setObject:singletonModule forKey:[[singletonModule class] name]];
}

- (void)maybeAddRegistryConsumer:(id)maybeConsumer
{
  if ([maybeConsumer conformsToProtocol:@protocol(EXModuleRegistryConsumer)]) {
    [self addRegistryConsumer:(id<EXModuleRegistryConsumer>)maybeConsumer];
  }
}

- (void)addRegistryConsumer:(id<EXModuleRegistryConsumer>)registryConsumer
{
  [_registryConsumers addObject:registryConsumer];
}

# pragma mark - Registry API

- (id)getModuleImplementingProtocol:(Protocol *)protocol
{
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

- (EXSingletonModule *)getSingletonModuleForName:(NSString *)singletonModuleName
{
  return [_singletonModules objectForKey:singletonModuleName];
}

- (NSArray<id<EXInternalModule>> *)getAllInternalModules
{
  return [_internalModulesSet allObjects];
}

- (NSArray<EXExportedModule *> *)getAllExportedModules
{
  return [_exportedModules allValues];
}

- (NSArray<EXViewManager *> *)getAllViewManagers
{
  return [_viewManagerModules allValues];
}

- (NSArray<EXSingletonModule *> *)getAllSingletonModules
{
  return [_singletonModules allValues];
}

@end
