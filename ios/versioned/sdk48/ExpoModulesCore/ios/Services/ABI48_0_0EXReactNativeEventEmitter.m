// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXReactNativeEventEmitter.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXEventEmitter.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistry.h>
#import <ABI48_0_0ExpoModulesCore/Swift.h>

@interface ABI48_0_0EXReactNativeEventEmitter ()

@property (nonatomic, assign) int listenersCount;
@property (nonatomic, weak) ABI48_0_0EXModuleRegistry *exModuleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *modulesListenersCounts;

@end

@implementation ABI48_0_0EXReactNativeEventEmitter

ABI48_0_0RCT_EXPORT_MODULE(ABI48_0_0EXReactNativeEventEmitter)

- (instancetype)init
{
  if (self = [super init]) {
    _listenersCount = 0;
    _modulesListenersCounts = [NSMutableDictionary dictionary];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI48_0_0EXEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  NSMutableSet<NSString *> *eventsAccumulator = [NSMutableSet set];

  // Backwards compatibility for the new architecture
  if (_appContext) {
    [eventsAccumulator addObjectsFromArray:[_appContext getSupportedEvents]];
  }
  for (ABI48_0_0EXExportedModule *exportedModule in [_exModuleRegistry getAllExportedModules]) {
    if ([exportedModule conformsToProtocol:@protocol(ABI48_0_0EXEventEmitter)]) {
      id<ABI48_0_0EXEventEmitter> eventEmitter = (id<ABI48_0_0EXEventEmitter>)exportedModule;
      [eventsAccumulator addObjectsFromArray:[eventEmitter supportedEvents]];
    }
  }
  return [eventsAccumulator allObjects];
}

ABI48_0_0RCT_EXPORT_METHOD(addProxiedListener:(NSString *)moduleName eventName:(NSString *)eventName)
{
  [self addListener:eventName];

  // Backwards compatibility for the new architecture
  if ([_appContext hasModule:moduleName]) {
    [_appContext modifyEventListenersCount:moduleName count:1];
    return;
  }

  // Validate module
  ABI48_0_0EXExportedModule *module = [_exModuleRegistry getExportedModuleForName:moduleName];

  if (ABI48_0_0RCT_DEBUG && module == nil) {
    ABI48_0_0EXLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (ABI48_0_0RCT_DEBUG && ![module conformsToProtocol:@protocol(ABI48_0_0EXEventEmitter)]) {
    ABI48_0_0EXLogError(@"Module `%@` is not an ABI48_0_0EXEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  // Validate eventEmitter
  id<ABI48_0_0EXEventEmitter> eventEmitter = (id<ABI48_0_0EXEventEmitter>)module;

  if (ABI48_0_0RCT_DEBUG && ![[eventEmitter supportedEvents] containsObject:eventName]) {
    ABI48_0_0EXLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
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

ABI48_0_0RCT_EXPORT_METHOD(removeProxiedListeners:(NSString *)moduleName count:(double)count)
{
  [self removeListeners:count];

  // Backwards compatibility for the new architecture
  if ([_appContext hasModule:moduleName]) {
    [_appContext modifyEventListenersCount:moduleName count:-count];
    return;
  }

  // Validate module
  ABI48_0_0EXExportedModule *module = [_exModuleRegistry getExportedModuleForName:moduleName];

  if (ABI48_0_0RCT_DEBUG && module == nil) {
    ABI48_0_0EXLogError(@"Module for name `%@` has not been found.", moduleName);
    return;
  } else if (ABI48_0_0RCT_DEBUG && ![module conformsToProtocol:@protocol(ABI48_0_0EXEventEmitter)]) {
    ABI48_0_0EXLogError(@"Module `%@` is not an ABI48_0_0EXEventEmitter, thus it cannot be subscribed to.", moduleName);
    return;
  }

  id<ABI48_0_0EXEventEmitter> eventEmitter = (id<ABI48_0_0EXEventEmitter>)module;

  // Per-module observing state
  int newModuleListenersCount = [self moduleListenersCountFor:moduleName] - count;
  if (newModuleListenersCount == 0) {
    [eventEmitter stopObserving];
  } else if (newModuleListenersCount < 0) {
    ABI48_0_0EXLogError(@"Attempted to remove more `%@` listeners than added", moduleName);
    newModuleListenersCount = 0;
  }
  _modulesListenersCounts[moduleName] = [NSNumber numberWithInt:newModuleListenersCount];

  // Global observing state
  if (_listenersCount - count < 0) {
    ABI48_0_0EXLogError(@"Attempted to remove more proxied event emitter listeners than added");
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

# pragma mark - ABI48_0_0EXModuleRegistryConsumer

- (void)setModuleRegistry:(ABI48_0_0EXModuleRegistry *)moduleRegistry
{
  // We need to check if we get an object of the correct class because RN 65 tries to call this method with RTCModuleRegistry.
  // See https://github.com/facebook/react-native/blob/2c2b83171603b47e5eec61eea55139f760dba090/ABI48_0_0React/Base/ABI48_0_0RCTModuleData.mm#L274-L289.
  if ([moduleRegistry isKindOfClass:[ABI48_0_0EXModuleRegistry class]]) {
    _exModuleRegistry = moduleRegistry;
  }
}

@end
