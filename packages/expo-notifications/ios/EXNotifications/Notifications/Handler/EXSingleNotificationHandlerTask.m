// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXSingleNotificationHandlerTask.h>
#import <EXNotifications/EXNotificationSerializer.h>

static NSString * const onHandleNotification = @"onHandleNotification";
static NSString * const onHandleNotificationTimeout = @"onHandleNotificationTimeout";

static NSString * const shouldShowAlertKey = @"shouldShowAlert";
static NSString * const shouldPlaySoundKey = @"shouldPlaySound";
static NSString * const shouldSetBadgeKey = @"shouldSetBadge";

static NSTimeInterval const secondsToTimeout = 3;

static NSString * const EXNotificationHandlerErrorDomain = @"expo.notifications.handler";

@interface EXSingleNotificationHandlerTask ()

@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, strong) UNNotification *notification;
@property (nonatomic, copy) void (^completionHandler)(UNNotificationPresentationOptions);

@property (nonatomic, weak) id<EXSingleNotificationHandlerTaskDelegate> delegate;

@property (nonatomic, strong) NSTimer *timer;

@end

@implementation EXSingleNotificationHandlerTask

+ (NSArray<NSString *> *)eventNames
{
  return @[onHandleNotification, onHandleNotificationTimeout];
}

- (instancetype)initWithEventEmitter:(id<EXEventEmitterService>)eventEmitter
                        notification:(UNNotification *)notification
                   completionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
                            delegate:(nonnull id<EXSingleNotificationHandlerTaskDelegate>)delegate
{
  if (self = [super init]) {
    _eventEmitter = eventEmitter;
    _notification = notification;
    _completionHandler = completionHandler;
    _delegate = delegate;
  }
  return self;
}

- (NSString *)identifier
{
  return _notification.request.identifier;
}

- (void)start
{
  [_eventEmitter sendEventWithName:onHandleNotification body:@{
    @"id": _notification.request.identifier,
    @"notification": [EXNotificationSerializer serializedNotification:_notification]
  }];
  _timer = [NSTimer scheduledTimerWithTimeInterval:secondsToTimeout target:self selector:@selector(handleTimeout) userInfo:nil repeats:NO];
}

- (nullable NSError *)handleResponse:(NSDictionary *)response
{
  @synchronized (self) {
    NSError *maybeError = [self callCompletionHandlerWithOptions:[self presentationOptionsFromResponse:response]];
    [self finish];
    return maybeError;
  }
}

- (void)handleTimeout
{
  @synchronized (self) {
    [_eventEmitter sendEventWithName:onHandleNotificationTimeout body:@{
      @"id": _notification.request.identifier,
      @"notification": [EXNotificationSerializer serializedNotification:_notification]
    }];
    [self callCompletionHandlerWithOptions:UNNotificationPresentationOptionNone];
    [self finish];
  }
}

- (nullable NSError *)callCompletionHandlerWithOptions:(UNNotificationPresentationOptions)options
{
  if (_completionHandler) {
    _completionHandler(options);
    _completionHandler = nil;
    return nil;
  } else {
    return [NSError errorWithDomain:EXNotificationHandlerErrorDomain code:-1 userInfo:@{
      @"code": @"ERR_NOTIFICATION_RESPONSE_TIMEOUT",
      @"message": @"Notification has already been handled. Most probably the request has timed out."
    }];
  }
}

- (void)finish
{
  [_timer invalidate];
  _timer = nil;
  [_delegate taskDidFinish:self];
}

- (UNNotificationPresentationOptions)presentationOptionsFromResponse:(NSDictionary *)response
{
  UNNotificationPresentationOptions options = UNNotificationPresentationOptionNone;

  // TODO(iOS 14): use UNNotificationPresentationOptionList and UNNotificationPresentationOptionBanner
  if ([response[shouldShowAlertKey] boolValue]) {
    options |= UNNotificationPresentationOptionAlert;
  }
  if ([response[shouldPlaySoundKey] boolValue]) {
    options |= UNNotificationPresentationOptionSound;
  }
  if ([response[shouldSetBadgeKey] boolValue]) {
    options |= UNNotificationPresentationOptionBadge;
  }

  return options;
}

@end
