// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXReactNativeAdapter/EXReactNativeEventEmitter.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXExportedModule.h>
#import <EXCore/EXModuleRegistry.h>

@interface EXReactNativeEventEmitter ()

@property (nonatomic, assign) int listenersCount;
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *modulesListenersCounts;

@end

@implementation EXReactNativeEventEmitter

- (instancetype)init
{
  if (self = [super init]) {
    _listenersCount = 0;
    _modulesListenersCounts = [NSMutableDictionary dictionary];
  }
  return self;
}

EX_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"EXReactNativeEventEmitter";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  NSMutableSet<NSString *> *eventsAccumulator = [NSMutableSet set];
  for (EXExportedModule *exportedModule in [_moduleRegistry getAllExportedModules]) {
    if ([exportedModule conformsToProtocol:@protocol(EXEventEmitter)]) {
      id<EXEventEmitter> eventEmitter = (id<EXEventEmitter>)exportedModule;
      [eventsAccumulator addObjectsFromArray:[eventEmitter supportedEvents]];
    }
  }
  return [eventsAccumulator allObjects];
}

RCT_EXPORT_METHOD(addProxiedListener:(NSString *)moduleName eventName:(NSString *)eventName)
{
  [self addListener:eventName];
  // Validate module
  EXExportedModule *module = [_moduleRegistry getExportedModuleForName:moduleName];
  
  if (RCT_DEBUG && module == nil) {
    EXLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (RCT_DEBUG && ![module conformsToProtocol:@protocol(EXEventEmitter)]) {
    EXLogError(@"Module `%@` is not an EXEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  // Validate eventEmitter
  id<EXEventEmitter> eventEmitter = (id<EXEventEmitter>)module;

  if (RCT_DEBUG && ![[eventEmitter supportedEvents] containsObject:eventName]) {
    EXLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
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
  EXExportedModule *module = [_moduleRegistry getExportedModuleForName:moduleName];
  
  if (RCT_DEBUG && module == nil) {
    EXLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (RCT_DEBUG && ![module conformsToProtocol:@protocol(EXEventEmitter)]) {
    EXLogError(@"Module `%@` is not an EXEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  id<EXEventEmitter> eventEmitter = (id<EXEventEmitter>)module;

  // Per-module observing state
  int newModuleListenersCount = [self moduleListenersCountFor:moduleName] - 1;
  if (newModuleListenersCount == 0) {
    [eventEmitter stopObserving];
  } else if (newModuleListenersCount < 0) {
    EXLogError(@"Attemted to remove more `%@` listeners than added", moduleName);
    newModuleListenersCount = 0;
  }
  _modulesListenersCounts[moduleName] = [NSNumber numberWithInt:newModuleListenersCount];

  // Global observing state
  if (_listenersCount - 1 < 0) {
    EXLogError(@"Attemted to remove more proxied event emitter listeners than added");
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

# pragma mark - EXModuleRegistryConsumer

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
