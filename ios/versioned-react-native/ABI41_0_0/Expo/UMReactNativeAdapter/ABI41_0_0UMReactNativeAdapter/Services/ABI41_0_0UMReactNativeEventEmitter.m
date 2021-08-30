// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0UMReactNativeEventEmitter.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitter.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistry.h>

@interface ABI41_0_0UMReactNativeEventEmitter ()

@property (nonatomic, assign) int listenersCount;
@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *umModuleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *modulesListenersCounts;

@end

@implementation ABI41_0_0UMReactNativeEventEmitter

- (instancetype)init
{
  if (self = [super init]) {
    _listenersCount = 0;
    _modulesListenersCounts = [NSMutableDictionary dictionary];
  }
  return self;
}

ABI41_0_0UM_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"ABI41_0_0UMReactNativeEventEmitter";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI41_0_0UMEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  NSMutableSet<NSString *> *eventsAccumulator = [NSMutableSet set];
  for (ABI41_0_0UMExportedModule *exportedModule in [_umModuleRegistry getAllExportedModules]) {
    if ([exportedModule conformsToProtocol:@protocol(ABI41_0_0UMEventEmitter)]) {
      id<ABI41_0_0UMEventEmitter> eventEmitter = (id<ABI41_0_0UMEventEmitter>)exportedModule;
      [eventsAccumulator addObjectsFromArray:[eventEmitter supportedEvents]];
    }
  }
  return [eventsAccumulator allObjects];
}

ABI41_0_0RCT_EXPORT_METHOD(addProxiedListener:(NSString *)moduleName eventName:(NSString *)eventName)
{
  [self addListener:eventName];
  // Validate module
  ABI41_0_0UMExportedModule *module = [_umModuleRegistry getExportedModuleForName:moduleName];

  if (ABI41_0_0RCT_DEBUG && module == nil) {
    ABI41_0_0UMLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (ABI41_0_0RCT_DEBUG && ![module conformsToProtocol:@protocol(ABI41_0_0UMEventEmitter)]) {
    ABI41_0_0UMLogError(@"Module `%@` is not an ABI41_0_0UMEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  // Validate eventEmitter
  id<ABI41_0_0UMEventEmitter> eventEmitter = (id<ABI41_0_0UMEventEmitter>)module;

  if (ABI41_0_0RCT_DEBUG && ![[eventEmitter supportedEvents] containsObject:eventName]) {
    ABI41_0_0UMLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
               eventName, moduleName, [[eventEmitter supportedEvents] componentsJoinedByString:@"`, `"]);
  }

  // Global observing state
  _listenersCount += 1;
  if (_listenersCount == 1) {
    [self startObserving];
  }

  // Per-module observing state
  int newModuleListenersCount = [self moduleListenersCountFor:moduleName] + 1;
  if (newModuleListenersCount == 1) {
    [eventEmitter startObserving];
  }
  _modulesListenersCounts[moduleName] = [NSNumber numberWithInt:newModuleListenersCount];
}

ABI41_0_0RCT_EXPORT_METHOD(removeProxiedListeners:(NSString *)moduleName count:(double)count)
{
  [self removeListeners:count];
  // Validate module
  ABI41_0_0UMExportedModule *module = [_umModuleRegistry getExportedModuleForName:moduleName];

  if (ABI41_0_0RCT_DEBUG && module == nil) {
    ABI41_0_0UMLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (ABI41_0_0RCT_DEBUG && ![module conformsToProtocol:@protocol(ABI41_0_0UMEventEmitter)]) {
    ABI41_0_0UMLogError(@"Module `%@` is not an ABI41_0_0UMEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  id<ABI41_0_0UMEventEmitter> eventEmitter = (id<ABI41_0_0UMEventEmitter>)module;

  // Per-module observing state
  int newModuleListenersCount = [self moduleListenersCountFor:moduleName] - count;
  if (newModuleListenersCount == 0) {
    [eventEmitter stopObserving];
  } else if (newModuleListenersCount < 0) {
    ABI41_0_0UMLogError(@"Attempted to remove more `%@` listeners than added", moduleName);
    newModuleListenersCount = 0;
  }
  _modulesListenersCounts[moduleName] = [NSNumber numberWithInt:newModuleListenersCount];

  // Global observing state
  if (_listenersCount - count < 0) {
    ABI41_0_0UMLogError(@"Attempted to remove more proxied event emitter listeners than added");
    _listenersCount = 0;
  } else {
    _listenersCount -= count;
  }

  if (_listenersCount == 0) {
    [self stopObserving];
  }
}

# pragma mark Utilities

- (int)moduleListenersCountFor:(NSString *)moduleName
{
  NSNumber *moduleListenersCountNumber = _modulesListenersCounts[moduleName];
  int moduleListenersCount = 0;
  if (moduleListenersCountNumber != nil) {
    moduleListenersCount = [moduleListenersCountNumber intValue];
  }
  return moduleListenersCount;
}

# pragma mark - ABI41_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _umModuleRegistry = moduleRegistry;
}

@end
