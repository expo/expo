// Copyright © 2018 650 Industries. All rights reserved.

#import <objc/runtime.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistry+Downcasting.h>
#import <EXCore/EXModuleRegistryConsumer.h>

@interface EXModuleRegistry ()

@property NSMutableDictionary<NSString *, id<EXInternalModule>> *internalModules;
@property NSMutableDictionary<const NSString *, EXExportedModule *> *exportedModules;
@property NSMutableDictionary<const NSString *, EXViewManager *> *viewManagerModules;

@property NSMutableSet<id<EXModuleRegistryConsumer>> *registryConsumers;

@end

@implementation EXModuleRegistry

# pragma mark - Lifecycle

- (instancetype)init
{
  if (self = [super init]) {
    _internalModules = [NSMutableDictionary dictionary];
    _exportedModules = [NSMutableDictionary dictionary];
    _viewManagerModules = [NSMutableDictionary dictionary];
    _registryConsumers = [NSMutableSet set];
  }
  return self;
}

- (instancetype)initWithInternalModules:(NSSet<id<EXInternalModule>> *)internalModules
                        exportedModules:(NSSet<EXExportedModule *> *)exportedModules
                           viewManagers:(NSSet<EXViewManager *> *)viewManagers
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
  }
  return self;
}

- (void)initialize
{
  for (id<EXModuleRegistryConsumer> registryConsumer in _registryConsumers) {
    [registryConsumer setModuleRegistry:self];
  }
}

# pragma mark - Registering modules

- (void)registerInternalModule:(id<EXInternalModule>)internalModule
{
  for (NSString *internalModuleName in [[internalModule class] internalModuleNames]) {
    if (_internalModules[internalModuleName]) {
      EXLogWarn(@"Expo module %@ overrides %@ as the module registered as %@.", internalModule, _internalModules[internalModuleName], internalModuleName);
    } else {
      _internalModules[internalModuleName] = internalModule;
      [self maybeAddRegistryConsumer:internalModule];
    }
  }
}

- (void)registerExportedModule:(EXExportedModule *)exportedModule
{
  const NSString *exportedModuleName = [[exportedModule class] exportedModuleName];
  if (_exportedModules[exportedModuleName]) {
    EXLogWarn(@"Expo module %@ overrides %@ as the module exported as %@.", exportedModule, _exportedModules[exportedModuleName], exportedModuleName);
  } else {
    _exportedModules[exportedModuleName] = exportedModule;
    [self maybeAddRegistryConsumer:exportedModule];
  }
}

- (void)registerViewManager:(EXViewManager *)viewManager
{
  const NSString *exportedModuleName = [[viewManager class] exportedModuleName];
  if (_viewManagerModules[exportedModuleName]) {
    EXLogWarn(@"Expo view manager %@ overrides %@ as the module exported as %@.", viewManager, _viewManagerModules[exportedModuleName], exportedModuleName);
  } else {
    _viewManagerModules[exportedModuleName] = viewManager;
    [self maybeAddRegistryConsumer:viewManager];
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
  [_registryConsumers addObject:registryConsumer];
}

# pragma mark - Registry API

- (id)getModuleForName:(NSString *)name
{
  return _internalModules[name];
}

- (id<EXInternalModule>)getExportedModuleForName:(NSString *)name
{
  return _exportedModules[name];
}

- (id)getModuleForName:(NSString *)name downcastedTo:(Protocol *)protocol exception:(NSException * __autoreleasing *)outException
{
  id<EXInternalModule> instance = [self getModuleForName:name];
  if (instance) {
    [self downcastInstance:instance toProtocol:protocol exception:outException];
  }
  return instance;
}

- (NSArray<id<EXInternalModule>> *)getAllInternalModules
{
  return [[NSSet setWithArray:[_internalModules allValues]] allObjects];
}

- (NSArray<EXExportedModule *> *)getAllExportedModules
{
  return [_exportedModules allValues];
}

- (NSArray<EXViewManager *> *)getAllViewManagers
{
  return [_viewManagerModules allValues];
}

# pragma mark - Utilities

- (id<EXInternalModule>)downcastInstance:(id<EXInternalModule>)instance toProtocol:(Protocol *)protocol exception:(NSException * __autoreleasing *)outException
{
  @try {
    [self downcastInstance:instance toProtocol:protocol];
    return instance;
  }
  @catch (NSException *exception) {
    if (outException) {
      *outException = exception;
    } else {
      EXLogWarn(@"Downcasting exception is being ignored: %@.", exception);
    }
    return nil;
  }
}

@end
