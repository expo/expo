// Copyright 2018-present 650 Industries. All rights reserved.

#import <EDUMReactNativeEventEmitter.h>
#import <EDUMEventEmitter.h>
#import <EDUMExportedModule.h>
#import <EDUMModuleRegistry.h>

@interface EDUMReactNativeEventEmitter ()

@property (nonatomic, assign) int listenersCount;
@property (nonatomic, weak) EDUMModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *modulesListenersCounts;

@end

@implementation EDUMReactNativeEventEmitter

- (instancetype)init
{
  if (self = [super init]) {
    _listenersCount = 0;
    _modulesListenersCounts = [NSMutableDictionary dictionary];
  }
  return self;
}

EDUM_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"EDUMReactNativeEventEmitter";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EDUMEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  NSMutableSet<NSString *> *eventsAccumulator = [NSMutableSet set];
  for (EDUMExportedModule *exportedModule in [_moduleRegistry getAllExportedModules]) {
    if ([exportedModule conformsToProtocol:@protocol(EDUMEventEmitter)]) {
      id<EDUMEventEmitter> eventEmitter = (id<EDUMEventEmitter>)exportedModule;
      [eventsAccumulator addObjectsFromArray:[eventEmitter supportedEvents]];
    }
  }
  return [eventsAccumulator allObjects];
}

RCT_EXPORT_METHOD(addProxiedListener:(NSString *)moduleName eventName:(NSString *)eventName)
{
  [self addListener:eventName];
  // Validate module
  EDUMExportedModule *module = [_moduleRegistry getExportedModuleForName:moduleName];
  
  if (RCT_DEBUG && module == nil) {
    EDUMLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (RCT_DEBUG && ![module conformsToProtocol:@protocol(EDUMEventEmitter)]) {
    EDUMLogError(@"Module `%@` is not an EDUMEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  // Validate eventEmitter
  id<EDUMEventEmitter> eventEmitter = (id<EDUMEventEmitter>)module;

  if (RCT_DEBUG && ![[eventEmitter supportedEvents] containsObject:eventName]) {
    EDUMLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
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

RCT_EXPORT_METHOD(removeProxiedListeners:(NSString *)moduleName count:(double)count)
{
  [self removeListeners:count];
  // Validate module
  EDUMExportedModule *module = [_moduleRegistry getExportedModuleForName:moduleName];
  
  if (RCT_DEBUG && module == nil) {
    EDUMLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (RCT_DEBUG && ![module conformsToProtocol:@protocol(EDUMEventEmitter)]) {
    EDUMLogError(@"Module `%@` is not an EDUMEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  id<EDUMEventEmitter> eventEmitter = (id<EDUMEventEmitter>)module;

  // Per-module observing state
  int newModuleListenersCount = [self moduleListenersCountFor:moduleName] - 1;
  if (newModuleListenersCount == 0) {
    [eventEmitter stopObserving];
  } else if (newModuleListenersCount < 0) {
    EDUMLogError(@"Attempted to remove more `%@` listeners than added", moduleName);
    newModuleListenersCount = 0;
  }
  _modulesListenersCounts[moduleName] = [NSNumber numberWithInt:newModuleListenersCount];

  // Global observing state
  if (_listenersCount - 1 < 0) {
    EDUMLogError(@"Attempted to remove more proxied event emitter listeners than added");
    _listenersCount = 0;
  } else {
    _listenersCount -= 1;
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

# pragma mark - EDUMModuleRegistryConsumer

- (void)setModuleRegistry:(EDUMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
