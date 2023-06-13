// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXDefines.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUtilities.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXEventEmitterService.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXConstantsInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXTaskServiceInterface.h>

#import <ABI47_0_0EXTaskManager/ABI47_0_0EXTaskManager.h>
#import <ABI47_0_0EXTaskManager/ABI47_0_0EXTaskService.h>

NSString * const ABI47_0_0EXTaskManagerEventName = @"TaskManager.executeTask";

@interface ABI47_0_0EXTaskManager ()

@property (nonatomic, strong) NSString *appId;
@property (nonatomic, strong) NSMutableArray<NSDictionary *> *eventsQueue;
@property (nonatomic, weak) id<ABI47_0_0EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI47_0_0EXConstantsInterface> constantsService;
@property (nonatomic, weak) id<ABI47_0_0EXTaskServiceInterface> taskService;

@end

@implementation ABI47_0_0EXTaskManager

ABI47_0_0EX_EXPORT_MODULE(ExpoTaskManager);

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI47_0_0EXTaskManagerInterface)];
}

- (instancetype)init
{
  return [self initWithScopeKey:@"mainApplication"];
}

// TODO: Remove when adding bare ABI47_0_0React Native support
- (instancetype)initWithScopeKey:(NSString *)scopeKey
{
  if (self = [super init]) {
    _appId = scopeKey;
    _eventsQueue = [NSMutableArray new];
  }
  return self;
}

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXEventEmitterService)];
  _constantsService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXConstantsInterface)];
  _taskService = [moduleRegistry getSingletonModuleForName:@"TaskService"];

  // Register task manager in task service.
  [_taskService setTaskManager:self forAppId:_appId withUrl:[self _findAppUrl]];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"EVENT_NAME": ABI47_0_0EXTaskManagerEventName,
           };
}

# pragma mark - ABI47_0_0EXEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI47_0_0EXTaskManagerEventName];
}

/**
 *  When `startObserving` is called, it means the app is ready to execute new tasks.
 *  It also sends all events that were queued before this call.
 */
- (void)startObserving
{
  if (_eventsQueue && _eventsQueue.count > 0) {
    // Emit queued events
    for (NSDictionary *eventBody in _eventsQueue) {
      [_eventEmitter sendEventWithName:ABI47_0_0EXTaskManagerEventName body:eventBody];
    }
  }
  _eventsQueue = nil;
}

- (void)stopObserving {}

# pragma mark - Exported methods

ABI47_0_0EX_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailable:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  resolve(@(_taskService != nil));
}

ABI47_0_0EX_EXPORT_METHOD_AS(notifyTaskFinishedAsync,
                    notifyTaskFinished:(nonnull NSString *)taskName
                    withResponse:(nonnull NSDictionary *)response
                    resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  [_taskService notifyTaskWithName:taskName forAppId:_appId didFinishWithResponse:response];
  resolve(nil);
}

ABI47_0_0EX_EXPORT_METHOD_AS(isTaskRegisteredAsync,
                    isTaskRegistered:(nonnull NSString *)taskName
                    resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  resolve(@([self hasRegisteredTaskWithName:taskName]));
}

ABI47_0_0EX_EXPORT_METHOD_AS(getRegisteredTasksAsync,
                    getRegisteredTasks:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  resolve([_taskService getRegisteredTasksForAppId:_appId]);
}

ABI47_0_0EX_EXPORT_METHOD_AS(getTaskOptionsAsync,
                    getConfigurationForTaskName:(nonnull NSString *)taskName
                    resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  resolve(ABI47_0_0EXNullIfNil([_taskService getOptionsForTaskName:taskName forAppId:_appId]));
}

ABI47_0_0EX_EXPORT_METHOD_AS(unregisterTaskAsync,
                    unregisterTaskWithName:(nonnull NSString *)taskName
                    resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  @try {
    [self unregisterTaskWithName:taskName consumerClass:nil];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

ABI47_0_0EX_EXPORT_METHOD_AS(unregisterAllTasksAsync,
                    unregisterAllTasks:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  [_taskService unregisterAllTasksForAppId:_appId];
  resolve(nil);
}

# pragma mark - ABI47_0_0EXTaskManagerInterface

- (BOOL)hasRegisteredTaskWithName:(nonnull NSString *)taskName
{
  return [_taskService hasRegisteredTaskWithName:taskName forAppId:_appId];
}

- (BOOL)taskWithName:(nonnull NSString *)taskName hasConsumerOfClass:(Class)consumerClass
{
  return [_taskService taskWithName:taskName forAppId:_appId hasConsumerOfClass:consumerClass];
}

- (void)registerTaskWithName:(nonnull NSString *)taskName
                    consumer:(Class)consumerClass
                     options:(nonnull NSDictionary *)options
{
  NSString *appUrl = [self _findAppUrl];

  [_taskService registerTaskWithName:taskName
                               appId:_appId
                              appUrl:appUrl
                       consumerClass:consumerClass
                             options:options];
}

- (void)unregisterTaskWithName:(nonnull NSString *)taskName
                 consumerClass:(Class)consumerClass
{
  [_taskService unregisterTaskWithName:taskName forAppId:_appId consumerClass:consumerClass];
}

- (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode
{
  return [ABI47_0_0EXTaskService hasBackgroundModeEnabled:backgroundMode];
}

- (void)executeWithBody:(NSDictionary *)body
{
  if (!_eventsQueue) {
    // Module's event emitter is already being observed, so we can send events.
    [_eventEmitter sendEventWithName:ABI47_0_0EXTaskManagerEventName body:body];
  } else {
    // Otherwise add event body to the queue (it will be send in `startObserving`).
    [_eventsQueue addObject:body];
  }
}

- (BOOL)isRunningInHeadlessMode
{
  return [[_constantsService constants][@"isHeadless"] boolValue];
}

# pragma mark - internals

- (NSString *)_findAppUrl
{
  // TODO(@tsapeta): find app url for vanilla RN apps
  return [_constantsService constants][@"experienceUrl"];
}

@end
