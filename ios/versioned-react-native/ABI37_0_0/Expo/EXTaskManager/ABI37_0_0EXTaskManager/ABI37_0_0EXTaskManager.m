// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMDefines.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMUtilities.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitterService.h>

#import <ABI37_0_0UMConstantsInterface/ABI37_0_0UMConstantsInterface.h>

#import <ABI37_0_0EXTaskManager/ABI37_0_0EXTaskManager.h>
#import <ABI37_0_0EXTaskManager/ABI37_0_0EXTaskService.h>
#import <ABI37_0_0UMTaskManagerInterface/ABI37_0_0UMTaskServiceInterface.h>

NSString * const ABI37_0_0EXTaskManagerEventName = @"TaskManager.executeTask";

@interface ABI37_0_0EXTaskManager ()

@property (nonatomic, strong) NSString *appId;
@property (nonatomic, strong) NSMutableArray<NSDictionary *> *eventsQueue;
@property (nonatomic, weak) id<ABI37_0_0UMEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI37_0_0UMConstantsInterface> constantsService;
@property (nonatomic, weak) id<ABI37_0_0UMTaskServiceInterface> taskService;

@end

@implementation ABI37_0_0EXTaskManager

ABI37_0_0UM_EXPORT_MODULE(ExpoTaskManager);

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI37_0_0UMTaskManagerInterface)];
}

- (instancetype)init
{
  return [self initWithExperienceId:@"mainApplication"];
}

// TODO: Remove when adding bare ABI37_0_0React Native support
- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _appId = experienceId;
    _eventsQueue = [NSMutableArray new];
  }
  return self;
}

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMEventEmitterService)];
  _constantsService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMConstantsInterface)];
  _taskService = [moduleRegistry getSingletonModuleForName:@"TaskService"];

  // Register task manager in task service.
  [_taskService setTaskManager:self forAppId:_appId withUrl:[self _findAppUrl]];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"EVENT_NAME": ABI37_0_0EXTaskManagerEventName,
           };
}

# pragma mark - ABI37_0_0UMEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI37_0_0EXTaskManagerEventName];
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
      [_eventEmitter sendEventWithName:ABI37_0_0EXTaskManagerEventName body:eventBody];
    }
  }
  _eventsQueue = nil;
}

- (void)stopObserving {}

# pragma mark - Exported methods

ABI37_0_0UM_EXPORT_METHOD_AS(notifyTaskFinishedAsync,
                    notifyTaskFinished:(nonnull NSString *)taskName
                    withResponse:(nonnull NSDictionary *)response
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [_taskService notifyTaskWithName:taskName forAppId:_appId didFinishWithResponse:response];
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(isTaskRegisteredAsync,
                    isTaskRegistered:(nonnull NSString *)taskName
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  resolve(@([self hasRegisteredTaskWithName:taskName]));
}

ABI37_0_0UM_EXPORT_METHOD_AS(getRegisteredTasksAsync,
                    getRegisteredTasks:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  resolve([_taskService getRegisteredTasksForAppId:_appId]);
}

ABI37_0_0UM_EXPORT_METHOD_AS(getTaskOptionsAsync,
                    getConfigurationForTaskName:(nonnull NSString *)taskName
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  resolve(ABI37_0_0UMNullIfNil([_taskService getOptionsForTaskName:taskName forAppId:_appId]));
}

ABI37_0_0UM_EXPORT_METHOD_AS(unregisterTaskAsync,
                    unregisterTaskWithName:(nonnull NSString *)taskName
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  @try {
    [self unregisterTaskWithName:taskName consumerClass:nil];
  } @catch (NSException *e) {
    return reject(e.name, e.reason, nil);
  }
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(unregisterAllTasksAsync,
                    unregisterAllTasks:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [_taskService unregisterAllTasksForAppId:_appId];
  resolve(nil);
}

# pragma mark - ABI37_0_0UMTaskManagerInterface

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
  return [ABI37_0_0EXTaskService hasBackgroundModeEnabled:backgroundMode];
}

- (void)executeWithBody:(NSDictionary *)body
{
  if (!_eventsQueue) {
    // Module's event emitter is already being observed, so we can send events.
    [_eventEmitter sendEventWithName:ABI37_0_0EXTaskManagerEventName body:body];
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
  // TODO(@tsapeta): find app url for vanilla ABI37_0_0RN apps
  return [_constantsService constants][@"experienceUrl"];
}

@end
