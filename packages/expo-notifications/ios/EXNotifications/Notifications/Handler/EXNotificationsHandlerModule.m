// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationsHandlerModule.h>
#import <EXNotifications/EXNotificationSerializer.h>
#import <EXNotifications/EXNotificationCenterDelegate.h>

#import <ExpoModulesCore/EXEventEmitterService.h>

@interface EXNotificationsHandlerModule ()

@property (nonatomic, weak) id<EXNotificationCenterDelegate> notificationCenterDelegate;

@property (nonatomic, assign) BOOL isListening;
@property (nonatomic, assign) BOOL isBeingObserved;

@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;

@property (nonatomic, strong) NSMutableDictionary<NSString *, EXSingleNotificationHandlerTask *> *tasksMap;

@end

@implementation EXNotificationsHandlerModule

EX_EXPORT_MODULE(ExpoNotificationsHandlerModule);

- (instancetype)init
{
  if (self = [super init]) {
    _tasksMap = [NSMutableDictionary dictionary];
  }
  return self;
}

# pragma mark - Exported methods

EX_EXPORT_METHOD_AS(handleNotificationAsync,
                    handleNotificationAsync:(NSString *)identifier withBehavior:(NSDictionary *)behavior resolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  EXSingleNotificationHandlerTask *task = _tasksMap[identifier];
  if (!task) {
    NSString *message = [NSString stringWithFormat:@"Failed to handle notification %@, it has already been handled.", identifier];
    return reject(@"ERR_NOTIFICATION_HANDLED", message, nil);
  }
  NSError *error = [task handleResponse:behavior];
  if (error) {
    return reject(error.userInfo[@"code"], error.userInfo[@"message"], error);
  } else {
    resolve(nil);
  }
}

# pragma mark - EXModuleRegistryConsumer

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
  _notificationCenterDelegate = [moduleRegistry getSingletonModuleForName:@"NotificationCenterDelegate"];
}

# pragma mark - EXEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return [EXSingleNotificationHandlerTask eventNames];
}

- (void)startObserving
{
  [self setIsBeingObserved:YES];
}

- (void)stopObserving
{
  [self setIsBeingObserved:NO];
}

- (void)setIsBeingObserved:(BOOL)isBeingObserved
{
  _isBeingObserved = isBeingObserved;
  BOOL shouldListen = _isBeingObserved;
  if (shouldListen && !_isListening) {
    [_notificationCenterDelegate addDelegate:self];
    _isListening = YES;
  } else if (!shouldListen && _isListening) {
    [_notificationCenterDelegate removeDelegate:self];
    _isListening = NO;
  }
}

# pragma mark - EXNotificationsDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  EXSingleNotificationHandlerTask *task = [[EXSingleNotificationHandlerTask alloc] initWithEventEmitter:_eventEmitter
                                                                                           notification:notification
                                                                                      completionHandler:completionHandler
                                                                                               delegate:self];
  [_tasksMap setObject:task forKey:task.identifier];
  [task start];
}

# pragma mark - EXSingleNotificationHandlerTaskDelegate

- (void)taskDidFinish:(EXSingleNotificationHandlerTask *)task
{
  [_tasksMap removeObjectForKey:task.identifier];
}

@end
