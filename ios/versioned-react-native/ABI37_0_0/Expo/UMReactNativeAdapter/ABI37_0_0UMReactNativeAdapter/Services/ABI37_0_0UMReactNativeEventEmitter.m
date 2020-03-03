// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMReactNativeAdapter/ABI37_0_0UMReactNativeEventEmitter.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitter.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistry.h>

@interface ABI37_0_0UMReactNativeEventEmitter ()

@property (nonatomic, assign) int listenersCount;
@property (nonatomic, weak) ABI37_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *modulesListenersCounts;

@end

@implementation ABI37_0_0UMReactNativeEventEmitter

- (instancetype)init
{
  if (self = [super init]) {
    _listenersCount = 0;
    _modulesListenersCounts = [NSMutableDictionary dictionary];
  }
  return self;
}

ABI37_0_0UM_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"ABI37_0_0UMReactNativeEventEmitter";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI37_0_0UMEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  NSMutableSet<NSString *> *eventsAccumulator = [NSMutableSet set];
  for (ABI37_0_0UMExportedModule *exportedModule in [_moduleRegistry getAllExportedModules]) {
    if ([exportedModule conformsToProtocol:@protocol(ABI37_0_0UMEventEmitter)]) {
      id<ABI37_0_0UMEventEmitter> eventEmitter = (id<ABI37_0_0UMEventEmitter>)exportedModule;
      [eventsAccumulator addObjectsFromArray:[eventEmitter supportedEvents]];
    }
  }
  return [eventsAccumulator allObjects];
}

ABI37_0_0RCT_EXPORT_METHOD(addProxiedListener:(NSString *)moduleName eventName:(NSString *)eventName)
{
  [self addListener:eventName];
  // Validate module
  ABI37_0_0UMExportedModule *module = [_moduleRegistry getExportedModuleForName:moduleName];
  
  if (ABI37_0_0RCT_DEBUG && module == nil) {
    ABI37_0_0UMLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (ABI37_0_0RCT_DEBUG && ![module conformsToProtocol:@protocol(ABI37_0_0UMEventEmitter)]) {
    ABI37_0_0UMLogError(@"Module `%@` is not an ABI37_0_0UMEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  // Validate eventEmitter
  id<ABI37_0_0UMEventEmitter> eventEmitter = (id<ABI37_0_0UMEventEmitter>)module;

  if (ABI37_0_0RCT_DEBUG && ![[eventEmitter supportedEvents] containsObject:eventName]) {
    ABI37_0_0UMLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
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

ABI37_0_0RCT_EXPORT_METHOD(removeProxiedListeners:(NSString *)moduleName count:(double)count)
{
  [self removeListeners:count];
  // Validate module
  ABI37_0_0UMExportedModule *module = [_moduleRegistry getExportedModuleForName:moduleName];
  
  if (ABI37_0_0RCT_DEBUG && module == nil) {
    ABI37_0_0UMLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (ABI37_0_0RCT_DEBUG && ![module conformsToProtocol:@protocol(ABI37_0_0UMEventEmitter)]) {
    ABI37_0_0UMLogError(@"Module `%@` is not an ABI37_0_0UMEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  id<ABI37_0_0UMEventEmitter> eventEmitter = (id<ABI37_0_0UMEventEmitter>)module;

  // Per-module observing state
  int newModuleListenersCount = [self moduleListenersCountFor:moduleName] - 1;
  if (newModuleListenersCount == 0) {
    [eventEmitter stopObserving];
  } else if (newModuleListenersCount < 0) {
    ABI37_0_0UMLogError(@"Attempted to remove more `%@` listeners than added", moduleName);
    newModuleListenersCount = 0;
  }
  _modulesListenersCounts[moduleName] = [NSNumber numberWithInt:newModuleListenersCount];

  // Global observing state
  if (_listenersCount - 1 < 0) {
    ABI37_0_0UMLogError(@"Attempted to remove more proxied event emitter listeners than added");
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

# pragma mark - ABI37_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
