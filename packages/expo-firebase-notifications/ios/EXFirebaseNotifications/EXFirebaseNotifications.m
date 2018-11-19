// Copyright 2018-present 650 Industries. All rights reserved.

@import UserNotifications;

#import <EXFirebaseNotifications/EXFirebaseNotifications.h>
#import <EXFirebaseApp/EXFirebaseAppUtil.h>
#import <EXFirebaseMessaging/EXFirebaseMessaging.h>
#import <EXCore/EXUtilitiesInterface.h>
#import <EXCore/EXUtilities.h>
#import <CoreLocation/CoreLocation.h>

static NSString *const NOTIFICATIONS_NOTIFICATION_DISPLAYED = @"Expo.Firebase.notifications_notification_displayed";
static NSString *const NOTIFICATIONS_NOTIFICATION_OPENED = @"Expo.Firebase.notifications_notification_opened";
static NSString *const NOTIFICATIONS_NOTIFICATION_RECEIVED = @"Expo.Firebase.notifications_notification_received";

@interface EXFirebaseNotifications () <UNUserNotificationCenterDelegate>
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<EXUtilitiesInterface> utils;

@end

@implementation EXFirebaseNotifications {
  NSMutableDictionary<NSString *, void (^)(UIBackgroundFetchResult)> *completionHandlers;
}

static EXFirebaseNotifications *shared = nil;
// PRE-BRIDGE-EVENTS: Consider enabling this to allow events built up before the bridge is built to be sent to the JS side
// static NSMutableArray *pendingEvents = nil;
static NSDictionary *initialNotification = nil;
static bool jsReady = NO;
static NSString *const DEFAULT_ACTION = @"com.apple.UNNotificationDefaultActionIdentifier";

+ (nonnull instancetype)instance {
  return shared;
}

+ (void)configure {
  // PRE-BRIDGE-EVENTS: Consider enabling this to allow events built up before the bridge is built to be sent to the JS side
  // pendingEvents = [[NSMutableArray alloc] init];
  shared = [[EXFirebaseNotifications alloc] init];
}

EX_EXPORT_MODULE(ExpoFirebaseNotifications);

- (id)init {
  self = [super init];
  if (self != nil) {
    NSLog(@"Setting up EXFirebaseNotifications instance");
    [self initialise];
  }
  return self;
}

- (void)initialise {
  [UNUserNotificationCenter currentNotificationCenter].delegate = self;
  
  // Set static instance for use from AppDelegate
  shared = self;
  completionHandlers = [[NSMutableDictionary alloc] init];
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
  _utils = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)];
}

// PRE-BRIDGE-EVENTS: Consider enabling this to allow events built up before the bridge is built to be sent to the JS side
// The bridge is initialised after the module is created
// When the bridge is set, check if we have any pending events to send, and send them
/* - (void)setValue:(nullable id)value forKey:(NSString *)key {
 [super setValue:value forKey:key];
 if ([key isEqualToString:@"bridge"] && value) {
 for (NSDictionary* event in pendingEvents) {
 [EXFirebaseUtil sendJSEvent:_eventEmitter name:event[@"name"] body:event[@"body"]];
 }
 [pendingEvents removeAllObjects];
 }
 } */

// Listen for background messages
- (void)didReceiveRemoteNotification:(NSDictionary *)userInfo
              fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  // FCM Data messages come through here if they specify content-available=true
  // Pass them over to the EXFirebaseMessaging handler instead
  if (userInfo[@"aps"] && ((NSDictionary*)userInfo[@"aps"]).count == 1 && userInfo[@"aps"][@"content-available"]) {
    [[EXFirebaseMessaging instance] didReceiveRemoteNotification:userInfo];
    completionHandler(UIBackgroundFetchResultNoData);
    return;
  }
  
  NSDictionary *notification = [self parseUserInfo:userInfo];
  NSString *handlerKey = notification[@"notificationId"];

  NSString *event;
  if (EXSharedApplication().applicationState == UIApplicationStateBackground) {
    event = NOTIFICATIONS_NOTIFICATION_DISPLAYED;
  } else {
    // On IOS 10:
    // - foreground notifications also go through willPresentNotification
    // - background notification presses also go through didReceiveNotificationResponse
    // This prevents duplicate messages from hitting the JS app
    completionHandler(UIBackgroundFetchResultNoData);
    return;
  }
  
  // For onOpened events, we set the default action name as iOS 8/9 has no concept of actions
  if (event == NOTIFICATIONS_NOTIFICATION_OPENED) {
    notification = @{
                     @"action": DEFAULT_ACTION,
                     @"notification": notification
                     };
  }
  
  
  if (handlerKey != nil) {
    completionHandlers[handlerKey] = completionHandler;
  } else {
    completionHandler(UIBackgroundFetchResultNoData);
  }
  
  [self sendJSEvent:_eventEmitter name:event body:notification];
}

// *******************************************************
// ** Finish AppDelegate methods
// *******************************************************

// *******************************************************
// ** Start UNUserNotificationCenterDelegate methods
// ** iOS 10+
// *******************************************************

EX_EXPORT_METHOD_AS(complete,
                    complete:(NSString *)handlerKey
                    fetchResult:(NSString *)fetchResult
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if (handlerKey != nil) {
    void (^completionHandler)(UIBackgroundFetchResult) = completionHandlers[handlerKey];
    if(completionHandler != nil) {
      completionHandlers[handlerKey] = nil;
      completionHandler([EXFirebaseNotifications decodeUIBackgroundFetchResult:fetchResult]);
    }
  }
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(setCategories,
                    setCategories:(NSArray<NSDictionary *> *)categories
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  UNUserNotificationCenter *notificationCenter = [self getNotificationCenterOrReject:reject];
  if (notificationCenter == nil) {
    return;
  }

  NSMutableArray *nativeCategories = [NSMutableArray new];
  for (NSDictionary *category in categories) {
    [nativeCategories addObject:[EXFirebaseNotifications notificationCategoryJSONtoNative:category]];
  }
  
  [notificationCenter setNotificationCategories:[NSSet setWithArray:nativeCategories]];
  
  resolve([NSNull null]);
}


+ (UIBackgroundFetchResult)decodeUIBackgroundFetchResult:(NSString *)fetchResult
{
  if ([fetchResult isEqualToString:@"backgroundFetchResultNewData"]) {
    return UIBackgroundFetchResultNewData;
  }  else if ([fetchResult isEqualToString:@"backgroundFetchResultFailed"]) {
    return UIBackgroundFetchResultFailed;
  }
  return UIBackgroundFetchResultNoData;
}

// Handle incoming notification messages while app is in the foreground.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler {
  UNNotificationTrigger *trigger = notification.request.trigger;
  BOOL isFcm = trigger && [notification.request.trigger class] == [UNPushNotificationTrigger class];
  BOOL isScheduled = trigger && [notification.request.trigger class] == [UNCalendarNotificationTrigger class];
  
  NSString *event;
  UNNotificationPresentationOptions options;
  NSDictionary *message = [self parseUNNotification:notification];
  
  if (isFcm || isScheduled) {
    // If app is in the background
    if (EXSharedApplication().applicationState == UIApplicationStateBackground
        || EXSharedApplication().applicationState == UIApplicationStateInactive) {
      // display the notification
      options = UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge | UNNotificationPresentationOptionSound;
      // notification_displayed
      event = NOTIFICATIONS_NOTIFICATION_DISPLAYED;
    } else {
      // don't show notification
      options = UNNotificationPresentationOptionNone;
      // notification_received
      event = NOTIFICATIONS_NOTIFICATION_RECEIVED;
    }
  } else {
    // Triggered by `notifications().displayNotification(notification)`
    // Display the notification
    options = UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge | UNNotificationPresentationOptionSound;
    // notification_displayed
    event = NOTIFICATIONS_NOTIFICATION_DISPLAYED;
  }
  
  [self sendJSEvent:_eventEmitter name:event body:message];
  completionHandler(options);
}

// TODO: Bacon: I don't think this is ever nil
- (UNUserNotificationCenter *)getNotificationCenterOrReject:(EXPromiseRejectBlock)reject
{
  UNUserNotificationCenter *notificationCenter = [UNUserNotificationCenter currentNotificationCenter];
  if (notificationCenter == nil) {
    reject(@"notifications/error", @"Notification Center hasn't been created yet.", nil);
  }
  return notificationCenter;
}

#if defined(__IPHONE_11_0)

// Handle notification messages after display notification is tapped by the user.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void(^)(void))completionHandler {
  NSDictionary *message = [self parseUNNotificationResponse:response];
  [self sendJSEvent:_eventEmitter name:NOTIFICATIONS_NOTIFICATION_OPENED body:message];
  completionHandler();
}
#else
// Handle notification messages after display notification is tapped by the user.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void(^)())completionHandler {
  NSDictionary *message = [self parseUNNotificationResponse:response];
  [self sendJSEvent:_eventEmitter name:NOTIFICATIONS_NOTIFICATION_OPENED body:message];
  completionHandler();
}
#endif

// *******************************************************
// ** Finish UNUserNotificationCenterDelegate methods
// *******************************************************

EX_EXPORT_METHOD_AS(cancelAllNotifications,
                    cancelAllNotifications:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  UNUserNotificationCenter *notificationCenter = [self getNotificationCenterOrReject:reject];
  if (notificationCenter == nil) {
    return;
  }
  [notificationCenter removeAllPendingNotificationRequests];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(cancelNotification,
                    cancelNotification:(NSString *)notificationId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  UNUserNotificationCenter *notificationCenter = [self getNotificationCenterOrReject:reject];
  if (notificationCenter == nil) {
    return;
  }
  [notificationCenter removePendingNotificationRequestsWithIdentifiers:@[notificationId]];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(displayNotification,
                    displayNotification:(NSDictionary *)notification
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  UNUserNotificationCenter *notificationCenter = [self getNotificationCenterOrReject:reject];
  if (notificationCenter == nil) {
    return;
  }
  
  UNNotificationRequest* request = [self buildUNNotificationRequest:notification withSchedule:false];
  [notificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (!error) {
      resolve([NSNull null]);
    } else{
      reject(@"notifications/display_notification_error", @"Failed to display notificaton", error);
    }
  }];
}

EX_EXPORT_METHOD_AS(getBadge,
                    getBadge:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  // TODO: Bacon: use Expo util for preventing deadlock
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@([EXSharedApplication() applicationIconBadgeNumber]));
  });
}

EX_EXPORT_METHOD_AS(getInitialNotification,
                    getInitialNotification:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  // Check if we've cached an initial notification as this will contain the accurate action
  if (initialNotification) {
      resolve(initialNotification);
  } else {
      NSDictionary *launchOptions = _utils.launchOptions;
      if (launchOptions != nil && launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey]) {
          NSDictionary *remoteNotification = launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey];
          resolve(@{
                    @"action": DEFAULT_ACTION,
                    @"notification": [self parseUserInfo:remoteNotification]
                    });
      } else {
          resolve([NSNull null]);
      }
  }
}

EX_EXPORT_METHOD_AS(getScheduledNotifications,
                    getScheduledNotifications:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  UNUserNotificationCenter *notificationCenter = [self getNotificationCenterOrReject:reject];
  if (notificationCenter == nil) {
    return;
  }

  [notificationCenter getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
      NSMutableArray* notifications = [[NSMutableArray alloc] init];
      for (UNNotificationRequest *notif in requests){
          NSDictionary *notification = [self parseUNNotificationRequest:notif];
          [notifications addObject:notification];
      }
      resolve(notifications);
  }];
}

EX_EXPORT_METHOD_AS(removeAllDeliveredNotifications,
                    removeAllDeliveredNotifications:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  UNUserNotificationCenter *notificationCenter = [self getNotificationCenterOrReject:reject];
  if (notificationCenter == nil) {
    return;
  }
  [notificationCenter removeAllDeliveredNotifications];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(removeDeliveredNotification,
                    removeDeliveredNotification:(NSString *)notificationId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  UNUserNotificationCenter *notificationCenter = [self getNotificationCenterOrReject:reject];
  if (notificationCenter == nil) {
    return;
  }
  [notificationCenter removeDeliveredNotificationsWithIdentifiers:@[notificationId]];
  resolve([NSNull null]);
}

EX_EXPORT_METHOD_AS(scheduleNotification,
                    scheduleNotification:(NSDictionary *)notification
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  UNUserNotificationCenter *notificationCenter = [self getNotificationCenterOrReject:reject];
  if (notificationCenter == nil) {
    return;
  }

  UNNotificationRequest* request = [self buildUNNotificationRequest:notification withSchedule:true];
  [notificationCenter
   addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
      reject(@"notification/schedule_notification_error", @"Failed to schedule notificaton", error);
    } else{
      resolve([NSNull null]);
    }
  }];
}

EX_EXPORT_METHOD_AS(setBadge,
                    setBadge:(NSNumber *)number
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [EXSharedApplication() setApplicationIconBadgeNumber:[number integerValue]];
    resolve([NSNull null]);
  });
}

EX_EXPORT_METHOD_AS(jsInitialised,
                    jsInitialised:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  jsReady = YES;
  resolve([NSNull null]);
}

// Because of the time delay between the app starting and the bridge being initialised
// we create a temporary instance of EXFirebaseNotifications.
// With this temporary instance, we cache any events to be sent as soon as the bridge is set on the module
- (void)sendJSEvent:(id<EXEventEmitterService>)emitter name:(NSString *)name body:(id)body {
  if (emitter != nil && jsReady) {
    [EXFirebaseAppUtil sendJSEvent:emitter name:name body:body];
  } else {
    if ([name isEqualToString:NOTIFICATIONS_NOTIFICATION_OPENED] && !initialNotification) {
      initialNotification = body;
    } else if ([name isEqualToString:NOTIFICATIONS_NOTIFICATION_OPENED]) {
      NSLog(@"Multiple notification open events received before the JS Notifications module has been initialised");
    }
    // PRE-BRIDGE-EVENTS: Consider enabling this to allow events built up before the bridge is built to be sent to the JS side
    // [pendingEvents addObject:@{@"name":name, @"body":body}];
  }
}

+ (CLLocationCoordinate2D)coordinateJSONtoNative:(NSDictionary *)input
{
  return CLLocationCoordinate2DMake([input[@"lat"] doubleValue], [input[@"lon"] doubleValue]);
}

/*
 uuid: string
 id: string
 major: number
 minor: number
*/

+ (CLBeaconRegion *)beaconRegionJSONtoNative:(NSDictionary *)input
{
  // uint16_t
  CLBeaconMajorValue major = [input[@"major"] unsignedShortValue];
  CLBeaconMinorValue minor = [input[@"minor"] unsignedShortValue];
  NSString *identifier = input[@"id"];
  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:input[@"uuid"]];
  CLBeaconRegion *output = [[CLBeaconRegion alloc] initWithProximityUUID:uuid major:major minor:minor identifier:identifier];
  return output;
}

/*
 center: { lat: number, lon: number },
 radius: number,
 id: string,
 */

+ (CLCircularRegion *)circularRegionJSONtoNative:(NSDictionary *)input
{
  NSDictionary *coordinate = input[@"center"];
  CLLocationCoordinate2D center = [EXFirebaseNotifications coordinateJSONtoNative:coordinate];
  CLLocationDistance radius = [input[@"radius"] doubleValue];
  NSString *identifier = input[@"id"];
  CLCircularRegion *output = [[CLCircularRegion alloc] initWithCenter:center radius:radius identifier:identifier];
  return output;
}

+ (UNMutableNotificationContent *)notificationContentJSONtoNative:(NSDictionary *)input
{
  UNMutableNotificationContent *output = [[UNMutableNotificationContent alloc] init];
  
  return output;
}

- (UNNotificationRequest *)buildUNNotificationRequest:(NSDictionary *)notification
                                         withSchedule:(BOOL)withSchedule {
  UNMutableNotificationContent *content = [[UNMutableNotificationContent alloc] init];
  if (notification[@"body"]) {
    content.body = notification[@"body"];
  }
  if (notification[@"data"]) {
    content.userInfo = notification[@"data"];
  }
  
  /*
   * sound: local uri to audio file or "default";
   * isCritical: bool ios 12
   * volume: float ios 12
   */
  
    if (notification[@"sound"]) {
      if ([@"default" isEqualToString:notification[@"sound"]]) {
        content.sound = [UNNotificationSound defaultSound];
      } else {
        content.sound = [UNNotificationSound soundNamed:notification[@"sound"]];
      }
  }
  if (@available(iOS 12.0, *)) {
    BOOL isCritical = notification[@"isCritical"];
    if (isCritical) {
      float volume = 1;
      if (notification[@"volume"]) {
        volume = [notification[@"volume"] floatValue];
      }
      if (notification[@"sound"]) {
        content.sound = [UNNotificationSound criticalSoundNamed:notification[@"sound"] withAudioVolume:volume];
      } else {
        content.sound = [UNNotificationSound defaultCriticalSoundWithAudioVolume:volume];
      }
    }
  }
  
  if (@available(iOS 12.0, *)) {
    if (notification[@"summaryArgumentCount"]) {
      content.summaryArgumentCount = [notification[@"summaryArgumentCount"] integerValue];
    }
    if (notification[@"summaryArgument"]) {
      content.summaryArgument = notification[@"summaryArgument"];
    }
  }
  
  if (notification[@"subtitle"]) {
    content.subtitle = notification[@"subtitle"];
  }
  if (notification[@"title"]) {
    content.title = notification[@"title"];
  }
  if (notification[@"ios"]) {
    NSDictionary *ios = notification[@"ios"];
    if (ios[@"attachments"]) {
      NSMutableArray *attachments = [[NSMutableArray alloc] init];
      for (NSDictionary *a in ios[@"attachments"]) {
        NSString *identifier = a[@"identifier"];
        NSURL *url = [NSURL fileURLWithPath:a[@"url"]];
        NSMutableDictionary *attachmentOptions = nil;
        
        if (a[@"options"]) {
          NSDictionary *options = a[@"options"];
          attachmentOptions = [[NSMutableDictionary alloc] init];
          
          for (id key in options) {
            if ([key isEqualToString:@"typeHint"]) {
              attachmentOptions[UNNotificationAttachmentOptionsTypeHintKey] = options[key];
            } else if ([key isEqualToString:@"thumbnailHidden"]) {
              attachmentOptions[UNNotificationAttachmentOptionsThumbnailHiddenKey] = options[key];
            } else if ([key isEqualToString:@"thumbnailClippingRect"]) {
              attachmentOptions[UNNotificationAttachmentOptionsThumbnailClippingRectKey] = options[key];
            } else if ([key isEqualToString:@"thumbnailTime"]) {
              attachmentOptions[UNNotificationAttachmentOptionsThumbnailTimeKey] = options[key];
            }
          }
        }
        
        NSError *error;
        UNNotificationAttachment *attachment = [UNNotificationAttachment attachmentWithIdentifier:identifier URL:url options:attachmentOptions error:&error];
        if (attachment) {
          [attachments addObject:attachment];
        } else {
          NSLog(@"Failed to create attachment: %@", error);
        }
      }
      content.attachments = attachments;
    }
    
    if (ios[@"badge"]) {
      content.badge = ios[@"badge"];
    }
    if (ios[@"category"]) {
      content.categoryIdentifier = ios[@"category"];
    }
    if (ios[@"launchImage"]) {
      content.launchImageName = ios[@"launchImage"];
    }
    if (ios[@"threadIdentifier"]) {
      content.threadIdentifier = ios[@"threadIdentifier"];
    }
  }
  
  NSString *notificationId = notification[@"notificationId"];
  UNNotificationTrigger *trigger = nil;
  if (withSchedule) {
    NSDictionary *schedule = notification[@"schedule"];
    NSNumber *fireDateNumber = schedule[@"fireDate"];
    NSString *interval = schedule[@"repeatInterval"];
    NSDate *fireDate = [NSDate dateWithTimeIntervalSince1970:([fireDateNumber doubleValue] / 1000.0)];
    
    NSCalendarUnit calendarUnit;
    if (interval) {
      if ([interval isEqualToString:@"minute"]) {
        calendarUnit = NSCalendarUnitSecond;
      } else if ([interval isEqualToString:@"hour"]) {
        calendarUnit = NSCalendarUnitMinute | NSCalendarUnitSecond;
      } else if ([interval isEqualToString:@"day"]) {
        calendarUnit = NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
      } else if ([interval isEqualToString:@"week"]) {
        calendarUnit = NSCalendarUnitWeekday | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
      } else {
        calendarUnit = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
      }
    } else {
      // Needs to match exactly to the secpmd
      calendarUnit = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
    }
    
    NSDateComponents *components = [[NSCalendar currentCalendar] components:calendarUnit fromDate:fireDate];
    trigger = [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:components repeats:interval];
  } else if (notification[@"location"]) {
    BOOL repeats = [notification[@"repeats"] boolValue];
    trigger = [UNLocationNotificationTrigger triggerWithRegion:[EXFirebaseNotifications circularRegionJSONtoNative:notification[@"location"]] repeats:repeats];
  } else if (notification[@"beacon"]) {
    BOOL repeats = [notification[@"repeats"] boolValue];
    trigger = [UNLocationNotificationTrigger triggerWithRegion:[EXFirebaseNotifications beaconRegionJSONtoNative:notification[@"beacon"]] repeats:repeats];
  }
  
  return [UNNotificationRequest requestWithIdentifier:notificationId content:content trigger:trigger];
  
}

/* Action
 
 id: string,
 title: string
 options: ActionOptions,
 inputButtonTitle: string,
 inputPlaceholder: string
 
 
 ActionOptions
 authenticationRequired
 destructive
 foreground
 
 */

+ (UNNotificationAction *)notificationActionJSONtoNative:(NSDictionary *)input
{
  UNNotificationActionOptions options = 0;
  if (input[@"options"]) {
    options = [EXFirebaseNotifications notificationActionOptionsJSONtoNative:input[@"options"]];
  }

  NSString *identifier = input[@"id"];
  NSString *title = input[@"title"];
  NSString *textInputButtonTitle = input[@"inputButtonTitle"];
  NSString *textInputPlaceholder = input[@"inputPlaceholder"];
  
  NSString *type = input[@"type"];
  if ([type isEqualToString:@"input"]) {
    return [UNTextInputNotificationAction actionWithIdentifier:identifier title:title options:options textInputButtonTitle:textInputButtonTitle textInputPlaceholder:textInputPlaceholder];
  }
  return [UNNotificationAction actionWithIdentifier:identifier title:title options:options];
}

/*
 authenticationRequired
 destructive
 foreground
 */
+ (UNNotificationActionOptions)notificationActionOptionsJSONtoNative:(NSString *)input
{
  if ([input isEqualToString:@"authenticationRequired"]) {
    // Whether this action should require unlocking before being performed.
    return UNNotificationActionOptionAuthenticationRequired;
  } else if ([input isEqualToString:@"destructive"]) {
    // Whether this action should require unlocking before being performed.
    return UNNotificationActionOptionDestructive;
  } else if ([input isEqualToString:@"foreground"]) {
    // Whether this action should require unlocking before being performed.
    return UNNotificationActionOptionForeground;
  } else {
    // TODO: Bacon: This shouldn't be default?
    return UNNotificationActionOptionForeground;
  }
}

/*
 CategoryOption:
 
 hiddenPreviewsShowTitle
 hiddenPreviewsShowSubtitle
 customDismissAction
 allowInCarPlay
 */
+ (UNNotificationCategoryOptions)notificationCategoryOptionsJSONtoNative:(NSString *)input
{
  if (@available(iOS 11.0, *)) {
    if ([input isEqualToString:@"hiddenPreviewsShowTitle"]) {
      return UNNotificationCategoryOptionHiddenPreviewsShowTitle;
    } else if ([input isEqualToString:@"hiddenPreviewsShowSubtitle"]) {
      return UNNotificationCategoryOptionHiddenPreviewsShowSubtitle;
    }
  }
  if ([input isEqualToString:@"customDismissAction"]) {
    return UNNotificationCategoryOptionCustomDismissAction;
  } else if ([input isEqualToString:@"allowInCarPlay"]) {
    return UNNotificationCategoryOptionAllowInCarPlay;
  } else {
    // TODO: Bacon: This shouldn't be default?
    return UNNotificationCategoryOptionCustomDismissAction;
  }
}


/*
 id: string
 actions: Action[]
 intents: string[]
 options: CategoryOption
 placeholder: string
 format: string
 */
+ (UNNotificationCategory *)notificationCategoryJSONtoNative:(NSMutableDictionary *)input
{
  NSString *identifier = input[@"id"];
  NSMutableArray *actions = [NSMutableArray new];
  if (input[@"actions"]) {
    for (NSDictionary *action in input[@"actions"]) {
      [actions addObject:[EXFirebaseNotifications notificationActionJSONtoNative:action]];
    }
  }
  //INIntentIdentifiers
  NSArray<NSString *> *intents = input[@"intents"];
  UNNotificationCategoryOptions options = [EXFirebaseNotifications notificationCategoryOptionsJSONtoNative:input[@"options"]];

  if (@available(iOS 11.0, *)) {
    NSString *placeholder = input[@"placeholder"];
    if (@available(iOS 12.0, *)) {
    NSString *format = input[@"format"];
    return [UNNotificationCategory categoryWithIdentifier:identifier
                                                  actions:actions
                                        intentIdentifiers:intents
                            hiddenPreviewsBodyPlaceholder:placeholder
                                    categorySummaryFormat:format
                                                  options:options
            ];
    }
    return [UNNotificationCategory categoryWithIdentifier:identifier
                                                  actions:actions
                                        intentIdentifiers:intents
                            hiddenPreviewsBodyPlaceholder:placeholder
                                                  options:options
            ];
  } else
  return [UNNotificationCategory categoryWithIdentifier:identifier
                                                actions:actions
                                      intentIdentifiers:intents
                                                options:options
          ];
  
}

- (NSDictionary *)parseUNNotificationResponse:(UNNotificationResponse *)response {
  NSMutableDictionary *notificationResponse = [[NSMutableDictionary alloc] init];
  NSDictionary *notification = [self parseUNNotification:[response notification]];
  notificationResponse[@"notification"] = notification;
  notificationResponse[@"action"] = [response actionIdentifier];
  
  return notificationResponse;
}

- (NSDictionary *)parseUNNotification:(UNNotification *)notification {
  return [self parseUNNotificationRequest:[notification request]];
}

- (NSDictionary *)parseUNNotificationRequest:(UNNotificationRequest *)notificationRequest {
  NSMutableDictionary *notification = [[NSMutableDictionary alloc] init];
  
  notification[@"notificationId"] = [notificationRequest identifier];
  
  UNNotificationContent *content = [notificationRequest content];
  if ([content body]) {
    notification[@"body"] = [content body];
  }
  if (content.userInfo) {
    NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
    for (id k in [content userInfo]) {
      if ([k isEqualToString:@"aps"]
          || [k isEqualToString:@"gcm.message_id"]) {
        // ignore as these are handled by the OS
      } else {
        data[k] = content.userInfo[k];
      }
    }
    notification[@"data"] = data;
  }
  if ([content sound]) {
    notification[@"sound"] = [content sound];
  }
  if ([content subtitle]) {
    notification[@"subtitle"] = [content subtitle];
  }
  if ([content title]) {
    notification[@"title"] = [content title];
  }
  
  NSMutableDictionary *ios = [[NSMutableDictionary alloc] init];
  
  if ([content attachments]) {
    NSMutableArray *attachments = [[NSMutableArray alloc] init];
    for (UNNotificationAttachment *a in [content attachments]) {
      NSMutableDictionary *attachment = [[NSMutableDictionary alloc] init];
      attachment[@"identifier"] = [a identifier];
      attachment[@"type"] = [a type];
      attachment[@"url"] = [[a URL] absoluteString];
      [attachments addObject:attachment];
    }
    ios[@"attachments"] = attachments;
  }
  
  if ([content badge]) {
    ios[@"badge"] = [content badge];
  }
  if ([content categoryIdentifier]) {
    ios[@"category"] = [content categoryIdentifier];
  }
  if ([content launchImageName]) {
    ios[@"launchImage"] = [content launchImageName];
  }
  if ([content threadIdentifier]) {
    ios[@"threadIdentifier"] = [content threadIdentifier];
  }
  notification[@"ios"] = ios;
  
  return notification;
}

- (NSDictionary *)parseUserInfo:(NSDictionary *)userInfo {
  
  NSMutableDictionary *notification = [[NSMutableDictionary alloc] init];
  NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
  NSMutableDictionary *ios = [[NSMutableDictionary alloc] init];
  
  for (id k1 in userInfo) {
    if ([k1 isEqualToString:@"aps"]) {
      NSDictionary *aps = userInfo[k1];
      for (id k2 in aps) {
        if ([k2 isEqualToString:@"alert"]) {
          // alert can be a plain text string rather than a dictionary
          if ([aps[k2] isKindOfClass:[NSDictionary class]]) {
            NSDictionary *alert = aps[k2];
            for (id k3 in alert) {
              if ([k3 isEqualToString:@"body"]) {
                notification[@"body"] = alert[k3];
              } else if ([k3 isEqualToString:@"subtitle"]) {
                notification[@"subtitle"] = alert[k3];
              } else if ([k3 isEqualToString:@"title"]) {
                notification[@"title"] = alert[k3];
              } else if ([k3 isEqualToString:@"loc-args"]
                         || [k3 isEqualToString:@"loc-key"]
                         || [k3 isEqualToString:@"title-loc-args"]
                         || [k3 isEqualToString:@"title-loc-key"]) {
                // Ignore known keys
              } else {
                NSLog(@"Unknown alert key: %@", k2);
              }
            }
          } else {
            notification[@"title"] = aps[k2];
          }
        } else if ([k2 isEqualToString:@"badge"]) {
          ios[@"badge"] = aps[k2];
        } else if ([k2 isEqualToString:@"category"]) {
          ios[@"category"] = aps[k2];
        } else if ([k2 isEqualToString:@"sound"]) {
          notification[@"sound"] = aps[k2];
        } else {
          NSLog(@"Unknown aps key: %@", k2);
        }
      }
    } else if ([k1 isEqualToString:@"gcm.message_id"]) {
      notification[@"notificationId"] = userInfo[k1];
    } else if ([k1 isEqualToString:@"gcm.n.e"]
               || [k1 isEqualToString:@"gcm.notification.sound2"]
               || [k1 isEqualToString:@"google.c.a.c_id"]
               || [k1 isEqualToString:@"google.c.a.c_l"]
               || [k1 isEqualToString:@"google.c.a.e"]
               || [k1 isEqualToString:@"google.c.a.udt"]
               || [k1 isEqualToString:@"google.c.a.ts"]) {
      // Ignore known keys
    } else {
      // Assume custom data
      data[k1] = userInfo[k1];
    }
  }
  
  notification[@"data"] = data;
  notification[@"ios"] = ios;
  
  return notification;
}

#pragma mark - EXEventEmitter

- (NSArray<NSString *> *)supportedEvents {
  return @[NOTIFICATIONS_NOTIFICATION_DISPLAYED, NOTIFICATIONS_NOTIFICATION_OPENED, NOTIFICATIONS_NOTIFICATION_RECEIVED];
}

- (void)startObserving {
  
}

- (void)stopObserving
{
  
}


@end
