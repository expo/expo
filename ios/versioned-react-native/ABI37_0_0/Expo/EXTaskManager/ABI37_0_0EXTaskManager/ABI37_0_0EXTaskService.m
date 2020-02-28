// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMDefines.h>

#import <ABI37_0_0EXTaskManager/ABI37_0_0EXTask.h>
#import <ABI37_0_0EXTaskManager/ABI37_0_0EXTaskService.h>
#import <ABI37_0_0UMTaskManagerInterface/ABI37_0_0UMTaskConsumerInterface.h>

#import <ABI37_0_0UMAppLoader/ABI37_0_0UMAppLoaderProvider.h>
#import <ABI37_0_0UMAppLoader/ABI37_0_0UMAppRecordInterface.h>

@interface ABI37_0_0EXTaskService ()

// Array of task requests that are being executed.
@property (nonatomic, strong) NSMutableArray<ABI37_0_0EXTaskExecutionRequest *> *requests;

// Table of registered tasks. Schema: { "<appId>": { "<taskName>": ABI37_0_0EXTask } }
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSMutableDictionary<NSString *, ABI37_0_0EXTask *> *> *tasks;

// Dictionary with app records of running background apps. Schema: { "<appId>": ABI37_0_0EXAppRecordInterface }
@property (nonatomic, strong) NSMutableDictionary<NSString *, id<ABI37_0_0UMAppRecordInterface>> *appRecords;

// MapTable with task managers of running (foregrounded) apps. Schema: { "<appId>": ABI37_0_0UMTaskManagerInterface }
@property (nonatomic, strong) NSMapTable<NSString *, id<ABI37_0_0UMTaskManagerInterface>> *taskManagers;

// Same as above but for headless (backgrounded) apps.
@property (nonatomic, strong) NSMapTable<NSString *, id<ABI37_0_0UMTaskManagerInterface>> *headlessTaskManagers;

// Dictionary with events queues storing event bodies that should be passed to the manager as soon as it's available.
// Schema: { "<appId>": [<eventBodies...>] }
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSMutableArray<NSDictionary *> *> *eventsQueues;

// Storing events per app. Schema: { "<appId>": [<eventIds...>] }
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSMutableArray<NSString *> *> *events;

@end

@implementation ABI37_0_0EXTaskService

ABI37_0_0UM_REGISTER_SINGLETON_MODULE(TaskService)

- (instancetype)init
{
  if (self = [super init]) {
    _tasks = [NSMutableDictionary new];
    _requests = [NSMutableArray new];
    _appRecords = [NSMutableDictionary new];
    _taskManagers = [NSMapTable strongToWeakObjectsMapTable];
    _headlessTaskManagers = [NSMapTable strongToWeakObjectsMapTable];
    _eventsQueues = [NSMutableDictionary new];
    _events = [NSMutableDictionary new];
  }
  return self;
}

# pragma mark - ABI37_0_0UMTaskServiceInterface

/**
 *  Returns boolean value whether the task with given name is already registered for given appId.
 */
- (BOOL)hasRegisteredTaskWithName:(nonnull NSString *)taskName forAppId:(nonnull NSString *)appId
{
  id<ABI37_0_0UMTaskInterface> task = [self _getTaskWithName:taskName forAppId:appId];
  return task != nil;
}

/**
 *  Creates a new task, registers it and saves to the config stored in user defaults.
 *  It can throw an exception if given consumer class doesn't conform to ABI37_0_0UMTaskConsumerInterface protocol
 *  or another task with the same name and appId is already registered.
 */
- (void)registerTaskWithName:(NSString *)taskName
                       appId:(NSString *)appId
                      appUrl:(NSString *)appUrl
               consumerClass:(Class)consumerClass
                     options:(NSDictionary *)options
{
  Class unversionedConsumerClass = [self _unversionedClassFromClass:consumerClass];
  
  // Given consumer class doesn't conform to ABI37_0_0UMTaskConsumerInterface protocol
  if (![unversionedConsumerClass conformsToProtocol:@protocol(ABI37_0_0UMTaskConsumerInterface)]) {
    NSString *reason = @"Invalid `consumer` argument. It must be a class that conforms to ABI37_0_0UMTaskConsumerInterface protocol.";
    @throw [NSException exceptionWithName:@"E_INVALID_TASK_CONSUMER" reason:reason userInfo:nil];
  }
  
  id<ABI37_0_0UMTaskInterface> task = [self _getTaskWithName:taskName forAppId:appId];
  
  if (task && [task.consumer isMemberOfClass:unversionedConsumerClass]) {
    // Task already exists. Let's just update its options.
    [task setOptions:options];
    
    if ([task.consumer respondsToSelector:@selector(setOptions:)]) {
      [task.consumer setOptions:options];
    }
  } else {
    task = [self _internalRegisterTaskWithName:taskName
                                         appId:appId
                                        appUrl:appUrl
                                 consumerClass:unversionedConsumerClass
                                       options:options];
  }
  [self _addTaskToConfig:task];
}

/**
 *  Unregisters task with given name and for given appId. Also removes the task from the config.
 */
- (void)unregisterTaskWithName:(NSString *)taskName
                      forAppId:(NSString *)appId
                 consumerClass:(Class)consumerClass
{
  ABI37_0_0EXTask *task = (ABI37_0_0EXTask *)[self _getTaskWithName:taskName forAppId:appId];
  
  if (!task) {
    NSString *reason = [NSString stringWithFormat:@"Task '%@' not found for app ID '%@'.", taskName, appId];
    @throw [NSException exceptionWithName:@"E_TASK_NOT_FOUND" reason:reason userInfo:nil];
  }
  
  if (consumerClass != nil && ![task.consumer isMemberOfClass:[self _unversionedClassFromClass:consumerClass]]) {
    NSString *reason = [NSString stringWithFormat:@"Invalid task consumer. Cannot unregister task with name '%@' because it is associated with different consumer class.", taskName];
    @throw [NSException exceptionWithName:@"E_INVALID_TASK_CONSUMER" reason:reason userInfo:nil];
  }
  
  NSMutableDictionary *appTasks = [[self _getTasksForAppId:appId] mutableCopy];
  
  [appTasks removeObjectForKey:taskName];
  
  if (appTasks.count == 0) {
    [_tasks removeObjectForKey:appId];
  } else {
    [_tasks setObject:appTasks forKey:appId];
  }
  
  if ([task.consumer respondsToSelector:@selector(didUnregister)]) {
    [task.consumer didUnregister];
  }
  [self _removeTaskFromConfig:task.name appId:task.appId];
}

/**
 *  Unregisters all tasks associated with the specific app.
 */
- (void)unregisterAllTasksForAppId:(NSString *)appId
{
  NSDictionary *appTasks = _tasks[appId];
  
  if (appTasks) {
    // Call `didUnregister` on task consumers
    for (ABI37_0_0EXTask *task in [appTasks allValues]) {
      if ([task.consumer respondsToSelector:@selector(didUnregister)]) {
        [task.consumer didUnregister];
      }
    }
    
    [_tasks removeObjectForKey:appId];
    
    // Remove the app from the config in user defaults.
    [self _removeFromConfigAppWithId:appId];
  }
}

- (BOOL)taskWithName:(NSString *)taskName
            forAppId:(NSString *)appId
  hasConsumerOfClass:(Class)consumerClass
{
  id<ABI37_0_0UMTaskInterface> task = [self _getTaskWithName:taskName forAppId:appId];
  Class unversionedConsumerClass = [self _unversionedClassFromClass:consumerClass];
  return task ? [task.consumer isMemberOfClass:unversionedConsumerClass] : NO;
}

- (NSDictionary *)getOptionsForTaskName:(NSString *)taskName
                               forAppId:(NSString *)appId
{
  id<ABI37_0_0UMTaskInterface> task = [self _getTaskWithName:taskName forAppId:appId];
  return task.options;
}

- (NSArray *)getRegisteredTasksForAppId:(NSString *)appId
{
  NSDictionary<NSString *, id<ABI37_0_0UMTaskInterface>> *tasks = [self _getTasksForAppId:appId];
  NSMutableArray *results = [NSMutableArray new];
  
  for (NSString *taskName in tasks) {
    id<ABI37_0_0UMTaskInterface> task = tasks[taskName];
    
    if (task != nil) {
      [results addObject:@{
        @"taskName": taskName,
        @"taskType": task.consumer.taskType,
        @"options": task.options,
      }];
    }
  }
  return results;
}

- (void)notifyTaskWithName:(NSString *)taskName
                  forAppId:(NSString *)appId
     didFinishWithResponse:(NSDictionary *)response
{
  id<ABI37_0_0UMTaskInterface> task = [self _getTaskWithName:taskName forAppId:appId];
  NSString *eventId = response[@"eventId"];
  id result = response[@"result"];
  
  if ([task.consumer respondsToSelector:@selector(normalizeTaskResult:)]) {
    result = @([task.consumer normalizeTaskResult:result]);
  }
  if ([task.consumer respondsToSelector:@selector(didFinish)]) {
    [task.consumer didFinish];
  }
  
  // Inform requests about finished tasks
  for (ABI37_0_0EXTaskExecutionRequest *request in [_requests copy]) {
    if ([request isIncludingTask:task]) {
      [request task:task didFinishWithResult:result];
    }
  }
  
  // Remove event and maybe invalidate related app record
  NSMutableArray *appEvents = _events[appId];
  
  if (appEvents) {
    [appEvents removeObject:eventId];
    
    if (appEvents.count == 0) {
      [self->_events removeObjectForKey:appId];
      
      // Invalidate app record but after 1 seconds delay so we can still take batched events.
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        if (!self->_events[appId]) {
          [self _invalidateAppWithId:appId];
        }
      });
    }
  }
}

- (void)setTaskManager:(id<ABI37_0_0UMTaskManagerInterface>)taskManager
              forAppId:(NSString *)appId
               withUrl:(NSString *)appUrl
{
  // Determine in which table the task manager will be stored.
  // Having two tables for them is to prevent race condition problems,
  // when both foreground and background apps are launching at the same time.
  BOOL isHeadless = [taskManager isRunningInHeadlessMode];
  NSMapTable *taskManagersTable = isHeadless ? _headlessTaskManagers : _taskManagers;
  
  // Set task manager in appropriate table.
  [taskManagersTable setObject:taskManager forKey:appId];
  
  // Execute events waiting for the task manager.
  NSMutableArray *appEventQueue = _eventsQueues[appId];
  
  if (appEventQueue) {
    for (NSDictionary *body in appEventQueue) {
      [taskManager executeWithBody:body];
    }
  }
  
  // Remove events queue for that app.
  [_eventsQueues removeObjectForKey:appId];
  
  if (!isHeadless) {
    // Maybe update app url in user defaults. It might change only in non-headless mode.
    [self _maybeUpdateAppUrl:appUrl forAppId:appId];
  }
}

# pragma mark - ABI37_0_0EXTaskDelegate

- (void)executeTask:(nonnull id<ABI37_0_0UMTaskInterface>)task
           withData:(nullable NSDictionary *)data
          withError:(nullable NSError *)error
{
  id<ABI37_0_0UMTaskManagerInterface> taskManager = [self _taskManagerForAppId:task.appId];
  NSDictionary *executionInfo = [self _executionInfoForTask:task];
  NSDictionary *body = @{
    @"executionInfo": executionInfo,
    @"data": data ?: @{},
    @"error": ABI37_0_0UMNullIfNil([self _exportError:error]),
  };
  
  NSLog(@"ABI37_0_0EXTaskService: Executing task '%@' for app '%@'.", task.name, task.appId);
  
  // Save an event so we can keep tracking events for this app
  NSMutableArray *appEvents = _events[task.appId] ?: [NSMutableArray new];
  [appEvents addObject:executionInfo[@"eventId"]];
  [_events setObject:appEvents forKey:task.appId];
  
  if (taskManager != nil) {
    // Task manager is initialized and can execute events
    [taskManager executeWithBody:body];
    return;
  }
  
  if (_appRecords[task.appId] == nil) {
    // No app record yet - let's spin it up!
    [self _loadAppWithId:task.appId appUrl:task.appUrl];
  }
  
  // App record for that app exists, but it's not fully loaded as its task manager is not there yet.
  // We need to add event's body to the queue from which events will be executed once the task manager is ready.
  NSMutableArray *appEventsQueue = _eventsQueues[task.appId] ?: [NSMutableArray new];
  [appEventsQueue addObject:body];
  [_eventsQueues setObject:appEventsQueue forKey:task.appId];
  return;
}

# pragma mark - statics

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode
{
  NSArray *backgroundModes = [[NSBundle mainBundle] infoDictionary][@"UIBackgroundModes"];
  return backgroundModes != nil && [backgroundModes containsObject:backgroundMode];
}

# pragma mark - AppDelegate handlers

- (void)applicationDidFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [self _restoreTasks];
  
  ABI37_0_0UMTaskLaunchReason launchReason = [self _launchReasonForLaunchOptions:launchOptions];
  [self runTasksWithReason:launchReason userInfo:launchOptions completionHandler:nil];
}

- (void)runTasksWithReason:(ABI37_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [self _runTasksSupportingLaunchReason:launchReason userInfo:userInfo callback:^(NSArray * _Nonnull results) {
    if (!completionHandler) {
      return;
    }
    BOOL wasCompletionCalled = NO;
    
    // Iterate through the array of results. If there is at least one "NewData" or "Failed" result,
    // then just call completionHandler immediately with that value, otherwise return "NoData".
    for (NSNumber *result in results) {
      UIBackgroundFetchResult fetchResult = [result intValue];
      
      if (fetchResult == UIBackgroundFetchResultNewData || fetchResult == UIBackgroundFetchResultFailed) {
        completionHandler(fetchResult);
        wasCompletionCalled = YES;
        break;
      }
    }
    if (!wasCompletionCalled) {
      completionHandler(UIBackgroundFetchResultNoData);
    }
  }];
}

# pragma mark - internals


/**
 *  Returns the task object for given name and appId.
 */
- (id<ABI37_0_0UMTaskInterface>)_getTaskWithName:(NSString *)taskName
                               forAppId:(NSString *)appId
{
  return [self _getTasksForAppId:appId][taskName];
}

/**
 *  Returns dictionary of tasks for given appId. Dictionary in which the keys are the names for tasks,
 *  while the values are the task objects.
 */
- (NSDictionary<NSString *, ABI37_0_0EXTask *> *)_getTasksForAppId:(NSString *)appId
{
  return _tasks[appId];
}

/**
 *  Internal method that creates a task and registers it. It doesn't save anything to user defaults!
 */
- (ABI37_0_0EXTask *)_internalRegisterTaskWithName:(nonnull NSString *)taskName
                                    appId:(nonnull NSString *)appId
                                   appUrl:(nonnull NSString *)appUrl
                            consumerClass:(Class)consumerClass
                                  options:(nullable NSDictionary *)options
{
  NSMutableDictionary *appTasks = [[self _getTasksForAppId:appId] mutableCopy] ?: [NSMutableDictionary new];
  ABI37_0_0EXTask *task = [[ABI37_0_0EXTask alloc] initWithName:taskName
                                        appId:appId
                                       appUrl:appUrl
                                consumerClass:consumerClass
                                      options:options
                                     delegate:self];
  
  [appTasks setObject:task forKey:task.name];
  [_tasks setObject:appTasks forKey:appId];
  [task.consumer didRegisterTask:task];
  return task;
}

/**
 *  Modifies existing config of registered task with given task.
 */
- (void)_addTaskToConfig:(nonnull id<ABI37_0_0UMTaskInterface>)task
{
  NSMutableDictionary *dict = [[self _dictionaryWithRegisteredTasks] mutableCopy] ?: [NSMutableDictionary new];
  NSMutableDictionary *appDict = [dict[task.appId] mutableCopy] ?: [NSMutableDictionary new];
  NSMutableDictionary *tasks = [appDict[@"tasks"] mutableCopy] ?: [NSMutableDictionary new];
  NSDictionary *taskDict = [self _dictionaryFromTask:task];
  
  [tasks setObject:taskDict forKey:task.name];
  [appDict setObject:tasks forKey:@"tasks"];
  if (task.appUrl) {
    [appDict setObject:task.appUrl forKey:@"appUrl"];
  }
  [dict setObject:appDict forKey:task.appId];
  [self _saveConfigWithDictionary:dict];
}

/**
 *  Removes given task from the config of registered tasks.
 */
- (void)_removeTaskFromConfig:(NSString *)taskName appId:(NSString *)appId
{
  NSMutableDictionary *dict = [[self _dictionaryWithRegisteredTasks] mutableCopy];
  NSMutableDictionary *appDict = [dict[appId] mutableCopy];
  NSMutableDictionary *tasks = [appDict[@"tasks"] mutableCopy];
  
  if (tasks != nil) {
    [tasks removeObjectForKey:taskName];
    
    if ([tasks count] > 0) {
      [appDict setObject:tasks forKey:@"tasks"];
      [dict setObject:appDict forKey:appId];
    } else {
      [dict removeObjectForKey:appId];
    }
    [self _saveConfigWithDictionary:dict];
  }
}

- (void)_removeFromConfigAppWithId:(nonnull NSString *)appId
{
  NSMutableDictionary *dict = [[self _dictionaryWithRegisteredTasks] mutableCopy];
  
  if (dict[appId]) {
    [dict removeObjectForKey:appId];
    [self _saveConfigWithDictionary:dict];
  }
}

/**
 *  Saves given dictionary to user defaults, as a config with registered tasks.
 */
- (void)_saveConfigWithDictionary:(nonnull NSDictionary *)dict
{
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
  [userDefaults setObject:dict forKey:NSStringFromClass([self class])];
  [userDefaults synchronize];
}

- (void)_iterateTasksUsingBlock:(void(^)(id<ABI37_0_0UMTaskInterface> task))block
{
  for (NSString *appId in _tasks) {
    NSDictionary *appTasks = [self _getTasksForAppId:appId];
    
    for (NSString *taskName in appTasks) {
      id<ABI37_0_0UMTaskInterface> task = [self _getTaskWithName:taskName forAppId:appId];
      block(task);
    }
  }
}

/**
 *  Returns NSDictionary with registered tasks.
 *  Schema: {
 *    "<appId>": {
 *      "appUrl": "url to the bundle",
 *      "tasks": {
 *        "<taskName>": {
 *          "name": "task's name",
 *          "consumerClass": "name of consumer class, e.g. ABI37_0_0EXLocationTaskConsumer",
 *          "consumerVersion": 1,
 *          "options": {},
 *        },
 *      }
 *    }
 *  }
 */
- (nullable NSDictionary *)_dictionaryWithRegisteredTasks
{
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
  return [userDefaults dictionaryForKey:NSStringFromClass([self class])];
}

/**
 *  Returns NSDictionary representing single task.
 */
- (nullable NSDictionary *)_dictionaryFromTask:(id<ABI37_0_0UMTaskInterface>)task
{
  return @{
    @"name": task.name,
    @"consumerClass": [self _unversionedClassNameFromClass:task.consumer.class],
    @"consumerVersion": @([self _consumerVersion:task.consumer.class]),
    @"options": ABI37_0_0UMNullIfNil([task options]),
  };
}

- (void)_runTasksSupportingLaunchReason:(ABI37_0_0UMTaskLaunchReason)launchReason
                               userInfo:(nullable NSDictionary *)userInfo
                               callback:(void(^)(NSArray * _Nonnull results))callback
{
  __block ABI37_0_0EXTaskExecutionRequest *request;
  
  request = [[ABI37_0_0EXTaskExecutionRequest alloc] initWithCallback:^(NSArray * _Nonnull results) {
    if (callback != nil) {
      callback(results);
    }
    
    [self->_requests removeObject:request];
    request = nil;
  }];
  
  [_requests addObject:request];
  
  [self _iterateTasksUsingBlock:^(id<ABI37_0_0UMTaskInterface> task) {
    if ([task.consumer.class respondsToSelector:@selector(supportsLaunchReason:)] && [task.consumer.class supportsLaunchReason:launchReason]) {
      [self _addTask:task toRequest:request];
    }
  }];
  
  // Evaluate request immediately if no tasks were added.
  [request maybeEvaluate];
}

- (void)_loadAppWithId:(nonnull NSString *)appId
                appUrl:(nonnull NSString *)appUrl
{
  id<ABI37_0_0UMAppLoaderInterface> appLoader = [[ABI37_0_0UMAppLoaderProvider sharedInstance] createAppLoader:@"ABI37_0_0React-native-experience"];
  
  if (appLoader != nil && appUrl != nil) {
    __block id<ABI37_0_0UMAppRecordInterface> appRecord;
    
    NSLog(@"ABI37_0_0EXTaskService: Loading headless app '%@' with url '%@'.", appId, appUrl);
    
    appRecord = [appLoader loadAppWithUrl:appUrl options:nil callback:^(BOOL success, NSError *error) {
      if (!success) {
        NSLog(@"ABI37_0_0EXTaskService: Loading app '%@' from url '%@' failed. Error description: %@", appId, appUrl, error.description);
        [self->_events removeObjectForKey:appId];
        [self->_eventsQueues removeObjectForKey:appId];
        [self->_appRecords removeObjectForKey:appId];
        
        // Host unreachable? Unregister all tasks for that app.
        [self unregisterAllTasksForAppId:appId];
      }
    }];
    
    [_appRecords setObject:appRecord forKey:appId];
  }
}

/**
 *  Returns task manager for given appId. Task managers initialized in non-headless contexts have precedence over headless one.
 */
- (id<ABI37_0_0UMTaskManagerInterface>)_taskManagerForAppId:(NSString *)appId
{
  id<ABI37_0_0UMTaskManagerInterface> taskManager = [_taskManagers objectForKey:appId];
  return taskManager ?: [_headlessTaskManagers objectForKey:appId];
}

/**
 *  Updates appUrl for the app with given appId if necessary.
 *  Url to the app might change over time, especially in development.
 */
- (void)_maybeUpdateAppUrl:(NSString *)appUrl
                  forAppId:(NSString *)appId
{
  NSMutableDictionary *dict = [[self _dictionaryWithRegisteredTasks] mutableCopy];
  NSMutableDictionary *appDict = [dict[appId] mutableCopy];
  
  if (appDict != nil && ![appDict[@"appUrl"] isEqualToString:appUrl]) {
    appDict[@"appUrl"] = appUrl;
    dict[appId] = appDict;
    [self _saveConfigWithDictionary:dict];
  }
}

- (void)_restoreTasks
{
  NSDictionary *config = [self _dictionaryWithRegisteredTasks];
  
  if (config) {
    // Log restored config so it's debuggable
    NSLog(@"ABI37_0_0EXTaskService: Restoring tasks configuration: %@", config.description);
    
    for (NSString *appId in config) {
      NSDictionary *appConfig = config[appId];
      NSDictionary *tasksConfig = appConfig[@"tasks"];
      NSString *appUrl = appConfig[@"appUrl"];
      
      for (NSString *taskName in tasksConfig) {
        NSDictionary *taskConfig = tasksConfig[taskName];
        NSString *consumerClassName = taskConfig[@"consumerClass"];
        Class consumerClass = NSClassFromString(consumerClassName);
        
        if (consumerClass != nil) {
          NSUInteger currentConsumerVersion = [self _consumerVersion:consumerClass];
          NSUInteger previousConsumerVersion = [taskConfig[@"consumerVersion"] unsignedIntegerValue];
          
          // Check whether the current consumer class is compatible with the saved version
          if (currentConsumerVersion == previousConsumerVersion) {
            [self _internalRegisterTaskWithName:taskName
                                          appId:appId
                                         appUrl:appUrl
                                  consumerClass:consumerClass
                                        options:taskConfig[@"options"]];
          } else {
            ABI37_0_0UMLogWarn(
                      @"ABI37_0_0EXTaskService: Task consumer '%@' has version '%d' that is not compatible with the saved version '%d'.",
                      consumerClassName,
                      currentConsumerVersion,
                      previousConsumerVersion
                      );
            [self _removeTaskFromConfig:taskName appId:appId];
          }
        } else {
          ABI37_0_0UMLogWarn(@"ABI37_0_0EXTaskService: Cannot restore task '%@' because consumer class doesn't exist.", taskName);
          [self _removeTaskFromConfig:taskName appId:appId];
        }
      }
    }
  }
}

- (void)_addTask:(id<ABI37_0_0UMTaskInterface>)task toRequest:(ABI37_0_0EXTaskExecutionRequest *)request
{
  [request addTask:task];
  
  // Inform the consumer that the task can be executed from then on.
  // Some types of background tasks (like background fetch) may execute the task immediately.
  if ([[task consumer] respondsToSelector:@selector(didBecomeReadyToExecute)]) {
    [[task consumer] didBecomeReadyToExecute];
  }
}

- (NSDictionary *)_executionInfoForTask:(nonnull id<ABI37_0_0UMTaskInterface>)task
{
  NSString *appState = [self _exportAppState:[[UIApplication sharedApplication] applicationState]];
  return @{
    @"eventId": [[NSUUID UUID] UUIDString],
    @"taskName": task.name,
    @"appState": appState,
  };
}

- (void)_invalidateAppWithId:(NSString *)appId
{
  id<ABI37_0_0UMAppRecordInterface> appRecord = _appRecords[appId];
  
  if (appRecord) {
    [appRecord invalidate];
    [_appRecords removeObjectForKey:appId];
    [_headlessTaskManagers removeObjectForKey:appId];
  }
}

- (nullable NSDictionary *)_exportError:(nullable NSError *)error
{
  if (error == nil) {
    return nil;
  }
  return @{
    @"code": @(error.code),
    @"message": error.description,
  };
}

- (ABI37_0_0UMTaskLaunchReason)_launchReasonForLaunchOptions:(nullable NSDictionary *)launchOptions
{
  if (launchOptions == nil) {
    return ABI37_0_0UMTaskLaunchReasonUser;
  }
  if (launchOptions[UIApplicationLaunchOptionsBluetoothCentralsKey]) {
    return ABI37_0_0UMTaskLaunchReasonBluetoothCentrals;
  }
  if (launchOptions[UIApplicationLaunchOptionsBluetoothPeripheralsKey]) {
    return ABI37_0_0UMTaskLaunchReasonBluetoothPeripherals;
  }
  if (launchOptions[UIApplicationLaunchOptionsLocationKey]) {
    return ABI37_0_0UMTaskLaunchReasonLocation;
  }
  if (launchOptions[UIApplicationLaunchOptionsNewsstandDownloadsKey]) {
    return ABI37_0_0UMTaskLaunchReasonNewsstandDownloads;
  }
  if (launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey]) {
    return ABI37_0_0UMTaskLaunchReasonRemoteNotification;
  }
  return ABI37_0_0UMTaskLaunchReasonUnrecognized;
}

- (NSString *)_exportAppState:(UIApplicationState)appState
{
  switch (appState) {
    case UIApplicationStateActive:
      return @"active";
    case UIApplicationStateInactive:
      return @"inactive";
    case UIApplicationStateBackground:
      return @"background";
  }
}

/**
 *  Returns task consumer's version. Defaults to 0 if `taskConsumerVersion` is not implemented.
 */
- (NSUInteger)_consumerVersion:(Class)consumerClass
{
  if (consumerClass && [consumerClass respondsToSelector:@selector(taskConsumerVersion)]) {
    return [consumerClass taskConsumerVersion];
  }
  return 0;
}

/**
 *  Method that unversions class names, so we can always use unversioned task consumer classes.
 */
- (NSString *)_unversionedClassNameFromClass:(Class)versionedClass
{
  NSString *versionedClassName = NSStringFromClass(versionedClass);
  NSRegularExpression *regexp = [NSRegularExpression regularExpressionWithPattern:@"^ABI\\d+_\\d+_\\d+" options:0 error:nil];
  
  return [regexp stringByReplacingMatchesInString:versionedClassName
                                          options:0
                                            range:NSMakeRange(0, versionedClassName.length)
                                     withTemplate:@""];
}

/**
 *  Returns unversioned class from versioned one.
 */
- (Class)_unversionedClassFromClass:(Class)versionedClass
{
  NSString *unversionedClassName = [self _unversionedClassNameFromClass:versionedClass];
  return NSClassFromString(unversionedClassName);
}

@end
