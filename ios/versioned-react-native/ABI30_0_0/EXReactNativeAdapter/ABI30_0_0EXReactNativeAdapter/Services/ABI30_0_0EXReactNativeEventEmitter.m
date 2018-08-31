// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXReactNativeAdapter/ABI30_0_0EXReactNativeEventEmitter.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXEventEmitter.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXExportedModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistry.h>

@interface ABI30_0_0EXReactNativeEventEmitter ()

@property (nonatomic, assign) int listenersCount;
@property (nonatomic, weak) ABI30_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *modulesListenersCounts;

@end

@implementation ABI30_0_0EXReactNativeEventEmitter

- (instancetype)init
{
  if (self = [super init]) {
    _listenersCount = 0;
    _modulesListenersCounts = [NSMutableDictionary dictionary];
  }
  return self;
}

ABI30_0_0EX_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"ABI30_0_0EXReactNativeEventEmitter";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI30_0_0EXEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  NSMutableSet<NSString *> *eventsAccumulator = [NSMutableSet set];
  for (ABI30_0_0EXExportedModule *exportedModule in [_moduleRegistry getAllExportedModules]) {
    if ([exportedModule conformsToProtocol:@protocol(ABI30_0_0EXEventEmitter)]) {
      id<ABI30_0_0EXEventEmitter> eventEmitter = (id<ABI30_0_0EXEventEmitter>)exportedModule;
      [eventsAccumulator addObjectsFromArray:[eventEmitter supportedEvents]];
    }
  }
  return [eventsAccumulator allObjects];
}

ABI30_0_0RCT_EXPORT_METHOD(addProxiedListener:(NSString *)moduleName eventName:(NSString *)eventName)
{
  [self addListener:eventName];
  // Validate module
  ABI30_0_0EXExportedModule *module = [_moduleRegistry getExportedModuleForName:moduleName];
  
  if (ABI30_0_0RCT_DEBUG && module == nil) {
    ABI30_0_0EXLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (ABI30_0_0RCT_DEBUG && ![module conformsToProtocol:@protocol(ABI30_0_0EXEventEmitter)]) {
    ABI30_0_0EXLogError(@"Module `%@` is not an ABI30_0_0EXEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  // Validate eventEmitter
  id<ABI30_0_0EXEventEmitter> eventEmitter = (id<ABI30_0_0EXEventEmitter>)module;

  if (ABI30_0_0RCT_DEBUG && ![[eventEmitter supportedEvents] containsObject:eventName]) {
    ABI30_0_0EXLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
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

ABI30_0_0RCT_EXPORT_METHOD(removeProxiedListeners:(NSString *)moduleName count:(double)count)
{
  [self removeListeners:count];
  // Validate module
  ABI30_0_0EXExportedModule *module = [_moduleRegistry getExportedModuleForName:moduleName];
  
  if (ABI30_0_0RCT_DEBUG && module == nil) {
    ABI30_0_0EXLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (ABI30_0_0RCT_DEBUG && ![module conformsToProtocol:@protocol(ABI30_0_0EXEventEmitter)]) {
    ABI30_0_0EXLogError(@"Module `%@` is not an ABI30_0_0EXEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  id<ABI30_0_0EXEventEmitter> eventEmitter = (id<ABI30_0_0EXEventEmitter>)module;

  // Per-module observing state
  int newModuleListenersCount = [self moduleListenersCountFor:moduleName] - 1;
  if (newModuleListenersCount == 0) {
    [eventEmitter stopObserving];
  } else if (newModuleListenersCount < 0) {
    ABI30_0_0EXLogError(@"Attemted to remove more `%@` listeners than added", moduleName);
    newModuleListenersCount = 0;
  }
  _modulesListenersCounts[moduleName] = [NSNumber numberWithInt:newModuleListenersCount];

  // Global observing state
  if (_listenersCount - 1 < 0) {
    ABI30_0_0EXLogError(@"Attemted to remove more proxied event emitter listeners than added");
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

# pragma mark - ABI30_0_0EXModuleRegistryConsumer

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
