// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXDefines.h>
#import <EXCore/EXUtilities.h>
#import <EXCore/EXEventEmitterService.h>

#import <EXConstantsInterface/EXConstantsInterface.h>

#import <EXTaskManager/EXTaskManager.h>
#import <EXTaskManager/EXTaskService.h>
#import <EXTaskManagerInterface/EXTaskServiceInterface.h>

NSString * const EXTaskManagerEventName = @"TaskManager.executeTask";

@interface EXTaskManager ()

@property (nonatomic, strong) NSString *appId;
@property (nonatomic, strong) NSMutableArray<NSDictionary *> *eventsQueue;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<EXConstantsInterface> constantsService;
@property (nonatomic, weak) id<EXTaskServiceInterface> taskService;

@end

@implementation EXTaskManager

EX_EXPORT_MODULE(ExpoTaskManager);

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXTaskManagerInterface)];
}

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _appId = experienceId;
    _eventsQueue = [NSMutableArray new];
  }
  return self;
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
  _constantsService = [moduleRegistry getModuleImplementingProtocol:@protocol(EXConstantsInterface)];
  _taskService = [moduleRegistry getSingletonModuleForName:@"TaskService"];

  // Register task manager in task service.
  [_taskService setTaskManager:self forAppId:_appId withUrl:[self _findAppUrl]];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"EVENT_NAME": EXTaskManagerEventName,
           };
}

# pragma mark - EXEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[EXTaskManagerEventName];
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
      [_eventEmitter sendEventWithName:EXTaskManagerEventName body:eventBody];
    }
  }
  _eventsQueue = nil;
}

- (void)stopObserving {}

# pragma mark - Exported methods

EX_EXPORT_METHOD_AS(notifyTaskFinishedAsync,
                    notifyTaskFinished:(nonnull NSString *)taskName
                    withResponse:(nonnull NSDictionary *)response
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [_taskService notifyTaskWithName:taskName forAppId:_appId didFinishWithResponse:response];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(isTaskRegisteredAsync,
                    isTaskRegistered:(nonnull NSString *)taskName
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  resolve(@([self hasRegisteredTaskWithName:taskName]));
}

EX_EXPORT_METHOD_AS(getRegisteredTasksAsync,
                    getRegisteredTasks:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  resolve([_taskService getRegisteredTasksForAppId:_appId]);
}

EX_EXPORT_METHOD_AS(getTaskOptionsAsync,
                    getConfigurationForTaskName:(nonnull NSString *)taskName
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  resolve(EXNullIfNil([_taskService getOptionsForTaskName:taskName forAppId:_appId]));
}

EX_EXPORT_METHOD_AS(unregisterTaskAsync,
                    unregisterTaskWithName:(nonnull NSString *)taskName
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  @try {
    [self unregisterTaskWithName:taskName consumerClass:nil];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(unregisterAllTasksAsync,
                    unregisterAllTasks:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [_taskService unregisterAllTasksForAppId:_appId];
  resolve(nil);
}

# pragma mark - EXTaskManagerInterface

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
  return [EXTaskService hasBackgroundModeEnabled:backgroundMode];
}

- (void)executeWithBody:(NSDictionary *)body
{
  if (!_eventsQueue) {
    // Module's event emitter is already being observed, so we can send events.
    [_eventEmitter sendEventWithName:EXTaskManagerEventName body:body];
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
