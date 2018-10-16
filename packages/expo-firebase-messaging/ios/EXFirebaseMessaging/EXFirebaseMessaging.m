

@import UserNotifications;

#import <EXFirebaseMessaging/EXFirebaseMessaging.h>
#import <EXFirebaseApp/EXFirebaseAppEvents.h>
#import <EXFirebaseApp/EXFirebaseAppUtil.h>
#import <FirebaseMessaging/FirebaseMessaging.h>
#import <EXCore/EXUtilitiesInterface.h>

@interface EXFirebaseMessaging ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;

@end

@implementation EXFirebaseMessaging

static EXFirebaseMessaging *shared = nil;
static bool jsReady = FALSE;
static NSString* initialToken = nil;
static NSMutableArray* pendingMessages = nil;

+ (nonnull instancetype)instance {
  return shared;
}

EX_EXPORT_MODULE(ExpoFirebaseMessaging)

- (id)init {
  self = [super init];
  if (self != nil) {
    NSLog(@"Setting up EXFirebaseMessaging instance");
    [self configure];
  }
  return self;
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
}

- (void)startObserving {
  
}

- (void)stopObserving
{
  
}

- (void)configure {
  // Set as delegate for FIRMessaging
  [FIRMessaging messaging].delegate = self;
  
  // Establish Firebase managed data channel
  [FIRMessaging messaging].shouldEstablishDirectChannel = YES;
  
  // Set static instance for use from AppDelegate
  shared = self;
}

// *******************************************************
// ** Start AppDelegate methods
// ** iOS 8/9 Only
// *******************************************************

// Listen for FCM data messages that arrive as a remote notification
- (void)didReceiveRemoteNotification:(nonnull NSDictionary *)userInfo {
  NSDictionary *message = [self parseUserInfo:userInfo];
  [self sendJSEvent:_eventEmitter name:MESSAGING_MESSAGE_RECEIVED body:message];
}

- (void)didRegisterUserNotificationSettings:(nonnull UIUserNotificationSettings *)notificationSettings
{

}

// *******************************************************
// ** Finish AppDelegate methods
// *******************************************************


// *******************************************************
// ** Start FIRMessagingDelegate methods
// ** iOS 8+
// *******************************************************

// Listen for FCM tokens
- (void)messaging:(FIRMessaging *)messaging didReceiveRegistrationToken:(NSString *)fcmToken {
  NSLog(@"Received new FCM token: %@", fcmToken);
  [self sendJSEvent:_eventEmitter name:MESSAGING_TOKEN_REFRESHED body:@{ @"token": fcmToken }];
}

// Listen for data messages in the foreground
- (void)applicationReceivedRemoteMessage:(nonnull FIRMessagingRemoteMessage *)remoteMessage {
  NSDictionary *message = [self parseFIRMessagingRemoteMessage:remoteMessage];
  [self sendJSEvent:_eventEmitter name:MESSAGING_MESSAGE_RECEIVED body:message];
}

// Receive data messages on iOS 10+ directly from FCM (bypassing APNs) when the app is in the foreground.
// To enable direct data messages, you can set [Messaging messaging].shouldEstablishDirectChannel to YES.
- (void)messaging:(nonnull FIRMessaging *)messaging
didReceiveMessage:(nonnull FIRMessagingRemoteMessage *)remoteMessage {
  NSDictionary *message = [self parseFIRMessagingRemoteMessage:remoteMessage];
  [self sendJSEvent:_eventEmitter name:MESSAGING_MESSAGE_RECEIVED body:message];
}

// *******************************************************
// ** Finish FIRMessagingDelegate methods
// *******************************************************

// ** Start Expo Module methods **
EX_EXPORT_METHOD_AS(sendMessage,
                    sendMessage:(NSDictionary *)message
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if (!message[@"to"]) {
    reject(@"messaging/invalid-message", @"The supplied message is missing a 'to' field", nil);
  }
  NSString *to = message[@"to"];
  NSString *messageId = message[@"messageId"];
  NSNumber *ttl = message[@"ttl"];
  NSDictionary *data = message[@"data"];
  
  [[FIRMessaging messaging] sendMessage:data to:to withMessageID:messageId timeToLive:[ttl intValue]];
  
  // TODO: Listen for send success / errors
  resolve(nil);
}

EX_EXPORT_METHOD_AS(subscribeToTopic,
                    subscribeToTopic:(NSString*)topic
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[FIRMessaging messaging] subscribeToTopic:topic];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(unsubscribeFromTopic,
                    unsubscribeFromTopic:(NSString*)topic
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[FIRMessaging messaging] unsubscribeFromTopic:topic];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(jsInitialised,
                    jsInitialised:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  jsReady = TRUE;
  if (initialToken) {
    [self sendJSEvent:_eventEmitter name:MESSAGING_TOKEN_REFRESHED body:initialToken];
  }
  if (pendingMessages) {
    for (id message in pendingMessages) {
      [EXFirebaseAppUtil sendJSEvent:_eventEmitter name:MESSAGING_MESSAGE_RECEIVED body:message];
    }
    pendingMessages = nil;
  }
  resolve(nil);
}

// ** Start internals **

// Because of the time delay between the app starting and the bridge being initialised
// we catch any events that are received before the JS is ready to receive them
- (void)sendJSEvent:(id<EXEventEmitterService>)emitter name:(NSString *)name body:(id)body {
  if (emitter && jsReady) {
    [EXFirebaseAppUtil sendJSEvent:emitter name:name body:body];
  } else {
    if ([name isEqualToString:MESSAGING_TOKEN_REFRESHED]) {
      initialToken = body;
    } else if ([name isEqualToString:MESSAGING_MESSAGE_RECEIVED]) {
      if (!pendingMessages) {
        pendingMessages = [[NSMutableArray alloc] init];
      }
      [pendingMessages addObject:body];
    } else {
      NSLog(@"Received unexpected message type");
    }
  }
}

- (NSDictionary*)parseFIRMessagingRemoteMessage:(FIRMessagingRemoteMessage *)remoteMessage {
  NSDictionary *appData = remoteMessage.appData;
  
  NSMutableDictionary *message = [[NSMutableDictionary alloc] init];
  NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
  for (id k1 in appData) {
    if ([k1 isEqualToString:@"collapse_key"]) {
      message[@"collapseKey"] = appData[@"collapse_key"];
    } else if ([k1 isEqualToString:@"from"]) {
      message[@"from"] = appData[k1];
    } else if ([k1 isEqualToString:@"notification"]) {
      // Ignore for messages
    } else {
      // Assume custom data key
      data[k1] = appData[k1];
    }
  }
  message[@"data"] = data;
  
  return message;
}

- (NSDictionary*)parseUserInfo:(NSDictionary *)userInfo {
  NSMutableDictionary *message = [[NSMutableDictionary alloc] init];
  NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
  
  for (id k1 in userInfo) {
    if ([k1 isEqualToString:@"aps"]) {
      // Ignore notification section
    } else if ([k1 isEqualToString:@"gcm.message_id"]) {
      message[@"messageId"] = userInfo[k1];
    } else if ([k1 isEqualToString:@"google.c.a.ts"]) {
      message[@"sentTime"] = userInfo[k1];
    } else if ([k1 isEqualToString:@"gcm.n.e"]
               || [k1 isEqualToString:@"gcm.notification.sound2"]
               || [k1 isEqualToString:@"google.c.a.c_id"]
               || [k1 isEqualToString:@"google.c.a.c_l"]
               || [k1 isEqualToString:@"google.c.a.e"]
               || [k1 isEqualToString:@"google.c.a.udt"]) {
      // Ignore known keys
    } else {
      // Assume custom data
      data[k1] = userInfo[k1];
    }
  }
  
  message[@"data"] = data;
  
  return message;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[MESSAGING_MESSAGE_RECEIVED, MESSAGING_TOKEN_REFRESHED];
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end

