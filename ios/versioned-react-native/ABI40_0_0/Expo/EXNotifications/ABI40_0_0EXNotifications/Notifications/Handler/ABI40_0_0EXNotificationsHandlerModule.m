// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationsHandlerModule.h>
#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationSerializer.h>
#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationCenterDelegate.h>

#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitterService.h>

@interface ABI40_0_0EXNotificationsHandlerModule ()

@property (nonatomic, weak) id<ABI40_0_0EXNotificationCenterDelegate> notificationCenterDelegate;

@property (nonatomic, assign) BOOL isListening;
@property (nonatomic, assign) BOOL isBeingObserved;

@property (nonatomic, weak) id<ABI40_0_0UMEventEmitterService> eventEmitter;

@property (nonatomic, strong) NSMutableDictionary<NSString *, ABI40_0_0EXSingleNotificationHandlerTask *> *tasksMap;

@end

@implementation ABI40_0_0EXNotificationsHandlerModule

ABI40_0_0UM_EXPORT_MODULE(ExpoNotificationsHandlerModule);

- (instancetype)init
{
  if (self = [super init]) {
    _tasksMap = [NSMutableDictionary dictionary];
  }
  return self;
}

# pragma mark - Exported methods

ABI40_0_0UM_EXPORT_METHOD_AS(handleNotificationAsync,
                    handleNotificationAsync:(NSString *)identifier withBehavior:(NSDictionary *)behavior resolver:(ABI40_0_0UMPromiseResolveBlock)resolve rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  ABI40_0_0EXSingleNotificationHandlerTask *task = _tasksMap[identifier];
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

# pragma mark - ABI40_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI40_0_0UMModuleRegistry *)moduleRegistry
{
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI40_0_0UMEventEmitterService)];
  _notificationCenterDelegate = [moduleRegistry getSingletonModuleForName:@"NotificationCenterDelegate"];
}

# pragma mark - ABI40_0_0UMEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return [ABI40_0_0EXSingleNotificationHandlerTask eventNames];
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

# pragma mark - ABI40_0_0EXNotificationsDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  ABI40_0_0EXSingleNotificationHandlerTask *task = [[ABI40_0_0EXSingleNotificationHandlerTask alloc] initWithEventEmitter:_eventEmitter
                                                                                           notification:notification
                                                                                      completionHandler:completionHandler
                                                                                               delegate:self];
  [_tasksMap setObject:task forKey:task.identifier];
  [task start];
}

# pragma mark - ABI40_0_0EXSingleNotificationHandlerTaskDelegate

- (void)taskDidFinish:(ABI40_0_0EXSingleNotificationHandlerTask *)task
{
  [_tasksMap removeObjectForKey:task.identifier];
}

@end
