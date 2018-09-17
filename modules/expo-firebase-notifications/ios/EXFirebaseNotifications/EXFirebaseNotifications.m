#import <EXFirebaseNotifications/EXFirebaseNotifications.h>
#import <EXFirebaseApp/EXFirebaseAppEvents.h>
#import <EXFirebaseApp/EXFirebaseAppUtil.h>
#import <EXFirebaseMessaging/EXFirebaseMessaging.h>
#import <EXCore/EXUtilitiesInterface.h>
// For iOS 10 we need to implement UNUserNotificationCenterDelegate to receive display
// notifications via APNS
#if defined(__IPHONE_10_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0
@import UserNotifications;
@interface EXFirebaseNotifications () <UNUserNotificationCenterDelegate>
#else
@interface EXFirebaseNotifications ()
#endif
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<EXUtilitiesInterface> utils;

@end

@implementation EXFirebaseNotifications

static EXFirebaseNotifications *theEXFirebaseNotifications = nil;
// PRE-BRIDGE-EVENTS: Consider enabling this to allow events built up before the bridge is built to be sent to the JS side
// static NSMutableArray *pendingEvents = nil;
static NSDictionary *initialNotification = nil;
static bool jsReady = FALSE;
static NSString *const DEFAULT_ACTION = @"com.apple.UNNotificationDefaultActionIdentifier";

+ (nonnull instancetype)instance {
  return theEXFirebaseNotifications;
}

+ (void)configure {
  // PRE-BRIDGE-EVENTS: Consider enabling this to allow events built up before the bridge is built to be sent to the JS side
  // pendingEvents = [[NSMutableArray alloc] init];
  theEXFirebaseNotifications = [[EXFirebaseNotifications alloc] init];
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
  // If we're on iOS 10 then we need to set this as a delegate for the UNUserNotificationCenter
  if (@available(iOS 10.0, *)) {
    [UNUserNotificationCenter currentNotificationCenter].delegate = self;
  }
  
  // Set static instance for use from AppDelegate
  theEXFirebaseNotifications = self;
}

- (void)startObserving {
  
}

- (void)stopObserving
{
  
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
 [RNFirebaseUtil sendJSEvent:self name:event[@"name"] body:event[@"body"]];
 }
 [pendingEvents removeAllObjects];
 }
 } */

// *******************************************************
// ** Start AppDelegate methods
// ** iOS 8/9 Only
// *******************************************************
- (void)didReceiveLocalNotification:(nonnull UILocalNotification *)localNotification {
  if ([self isIOS89]) {
    NSString *event;
    if (EXSharedApplication().applicationState == UIApplicationStateBackground) {
      event = NOTIFICATIONS_NOTIFICATION_DISPLAYED;
    } else if (EXSharedApplication().applicationState == UIApplicationStateInactive) {
      event = NOTIFICATIONS_NOTIFICATION_OPENED;
    } else {
      event = NOTIFICATIONS_NOTIFICATION_RECEIVED;
    }
    
    NSDictionary *notification = [self parseUILocalNotification:localNotification];
    if (event == NOTIFICATIONS_NOTIFICATION_OPENED) {
      notification = @{
                       @"action": DEFAULT_ACTION,
                       @"notification": notification
                       };
    }
    [self sendJSEvent:self name:event body:notification];
  }
}

// Listen for background messages
- (void)didReceiveRemoteNotification:(NSDictionary *)userInfo
              fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  // FCM Data messages come through here if they specify content-available=true
  // Pass them over to the RNFirebaseMessaging handler instead
  if (userInfo[@"aps"] && ((NSDictionary*)userInfo[@"aps"]).count == 1 && userInfo[@"aps"][@"content-available"]) {
    [[EXFirebaseMessaging instance] didReceiveRemoteNotification:userInfo];
    completionHandler(UIBackgroundFetchResultNoData);
    return;
  }
  
  NSString *event;
  if (EXSharedApplication().applicationState == UIApplicationStateBackground) {
    event = NOTIFICATIONS_NOTIFICATION_DISPLAYED;
  } else if ([self isIOS89]) {
    if (EXSharedApplication().applicationState == UIApplicationStateInactive) {
      event = NOTIFICATIONS_NOTIFICATION_OPENED;
    } else {
      event = NOTIFICATIONS_NOTIFICATION_RECEIVED;
    }
  } else {
    // On IOS 10:
    // - foreground notifications also go through willPresentNotification
    // - background notification presses also go through didReceiveNotificationResponse
    // This prevents duplicate messages from hitting the JS app
    completionHandler(UIBackgroundFetchResultNoData);
    return;
  }
  
  NSDictionary *notification = [self parseUserInfo:userInfo];
  // For onOpened events, we set the default action name as iOS 8/9 has no concept of actions
  if (event == NOTIFICATIONS_NOTIFICATION_OPENED) {
    notification = @{
                     @"action": DEFAULT_ACTION,
                     @"notification": notification
                     };
  }
  
  [self sendJSEvent:self name:event body:notification];
  completionHandler(UIBackgroundFetchResultNoData);
}

// *******************************************************
// ** Finish AppDelegate methods
// *******************************************************

// *******************************************************
// ** Start UNUserNotificationCenterDelegate methods
// ** iOS 10+
// *******************************************************

#if defined(__IPHONE_10_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0
// Handle incoming notification messages while app is in the foreground.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler NS_AVAILABLE_IOS(10_0) {
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
  
  [self sendJSEvent:self name:event body:message];
  completionHandler(options);
}


#if defined(__IPHONE_11_0)

// Handle notification messages after display notification is tapped by the user.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void(^)(void))completionHandler NS_AVAILABLE_IOS(10_0) {
  NSDictionary *message = [self parseUNNotificationResponse:response];
  [self sendJSEvent:self name:NOTIFICATIONS_NOTIFICATION_OPENED body:message];
  completionHandler();
}
#else
// Handle notification messages after display notification is tapped by the user.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void(^)())completionHandler NS_AVAILABLE_IOS(10_0) {
  NSDictionary *message = [self parseUNNotificationResponse:response];
  [self sendJSEvent:self name:NOTIFICATIONS_NOTIFICATION_OPENED body:message];
  completionHandler();
}
#endif

// *******************************************************
// ** Finish UNUserNotificationCenterDelegate methods
// *******************************************************

EX_EXPORT_METHOD_AS(cancelAllNotifications,
                    cancelAllNotifications:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if ([self isIOS89]) {
    [EXSharedApplication() cancelAllLocalNotifications];
  } else {
    if (@available(iOS 10.0, *)) {
      UNUserNotificationCenter *notificationCenter = [UNUserNotificationCenter currentNotificationCenter];
      if (notificationCenter != nil) {
        [[UNUserNotificationCenter currentNotificationCenter] removeAllPendingNotificationRequests];
      }
    }
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(cancelNotification,
                    cancelNotification:(NSString*)notificationId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if ([self isIOS89]) {
    for (UILocalNotification *notification in EXSharedApplication().scheduledLocalNotifications) {
      NSDictionary *notificationInfo = notification.userInfo;
      if ([notificationId isEqualToString:[notificationInfo valueForKey:@"notificationId"]]) {
        [EXSharedApplication() cancelLocalNotification:notification];
      }
    }
  } else {
    if (@available(iOS 10.0, *)) {
      UNUserNotificationCenter *notificationCenter = [UNUserNotificationCenter currentNotificationCenter];
      if (notificationCenter != nil) {
        [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:@[notificationId]];
      }
    }
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(displayNotification,
                    displayNotification:(NSDictionary*)notification
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if ([self isIOS89]) {
    UILocalNotification* notif = [self buildUILocalNotification:notification withSchedule:false];
    [EXSharedApplication() presentLocalNotificationNow:notif];
    resolve(nil);
  } else {
    if (@available(iOS 10.0, *)) {
      UNNotificationRequest* request = [self buildUNNotificationRequest:notification withSchedule:false];
      [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
        if (!error) {
          resolve(nil);
        } else{
          reject(@"notifications/display_notification_error", @"Failed to display notificaton", error);
        }
      }];
    }
  }
}

EX_EXPORT_METHOD_AS(getBadge,
                    getBadge:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
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
      NSDictionary *launchOptions = [_utils launchOptions];
      if (!launchOptions) {
          reject(@"E_NO_LAUNCH_OPTIONS", @"The application's launch options couldn't be retrieved.", nil);
          return;
      }
      if (launchOptions[UIApplicationLaunchOptionsLocalNotificationKey]) {
          UILocalNotification *localNotification = launchOptions[UIApplicationLaunchOptionsLocalNotificationKey];
          resolve(@{
                    @"action": DEFAULT_ACTION,
                    @"notification": [self parseUILocalNotification:localNotification]
                    });
      } else if (launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey]) {
          NSDictionary *remoteNotification = launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey];
          resolve(@{
                    @"action": DEFAULT_ACTION,
                    @"notification": [self parseUserInfo:remoteNotification]
                    });
      } else {
          resolve(nil);
      }
  }
}

EX_EXPORT_METHOD_AS(getScheduledNotifications,
                    getScheduledNotifications:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    if ([self isIOS89]) {
        NSMutableArray* notifications = [[NSMutableArray alloc] init];
        for (UILocalNotification *notif in [EXSharedApplication() scheduledLocalNotifications]){
              NSDictionary *notification = [self parseUILocalNotification:notif];
              [notifications addObject:notification];
        }
        resolve(notifications);
    } else {
        if (@available(iOS 10.0, *)) {
            [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
                NSMutableArray* notifications = [[NSMutableArray alloc] init];
                for (UNNotificationRequest *notif in requests){
                    NSDictionary *notification = [self parseUNNotificationRequest:notif];
                    [notifications addObject:notification];
                }
                resolve(notifications);
            }];
        }
    }
}

EX_EXPORT_METHOD_AS(removeAllDeliveredNotifications,
                    removeAllDeliveredNotifications:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if ([self isIOS89]) {
    // No such functionality on iOS 8/9
  } else {
    if (@available(iOS 10.0, *)) {
      UNUserNotificationCenter *notificationCenter = [UNUserNotificationCenter currentNotificationCenter];
      if (notificationCenter != nil) {
        [[UNUserNotificationCenter currentNotificationCenter] removeAllDeliveredNotifications];
      }
    }
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(removeDeliveredNotification,
                    removeDeliveredNotification:(NSString*)notificationId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if ([self isIOS89]) {
    // No such functionality on iOS 8/9
  } else {
    if (@available(iOS 10.0, *)) {
      UNUserNotificationCenter *notificationCenter = [UNUserNotificationCenter currentNotificationCenter];
      if (notificationCenter != nil) {
        [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:@[notificationId]];
      }
    }
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(scheduleNotification,
                    scheduleNotification:(NSDictionary*)notification
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if ([self isIOS89]) {
    UILocalNotification* notif = [self buildUILocalNotification:notification withSchedule:true];
    [EXSharedApplication() scheduleLocalNotification:notif];
    resolve(nil);
  } else {
    if (@available(iOS 10.0, *)) {
      UNNotificationRequest* request = [self buildUNNotificationRequest:notification withSchedule:true];
      [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
        if (!error) {
          resolve(nil);
        } else{
          reject(@"notification/schedule_notification_error", @"Failed to schedule notificaton", error);
        }
      }];
    }
  }
}

EX_EXPORT_METHOD_AS(setBadge,
                    setBadge:(NSInteger)number
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [EXSharedApplication() setApplicationIconBadgeNumber:number];
    resolve(nil);
  });
}

EX_EXPORT_METHOD_AS(jsInitialised,
                    jsInitialised:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  jsReady = TRUE;
  resolve(nil);
}

// Because of the time delay between the app starting and the bridge being initialised
// we create a temporary instance of RNFirebaseNotifications.
// With this temporary instance, we cache any events to be sent as soon as the bridge is set on the module
- (void)sendJSEvent:(id<EXEventEmitter>)emitter name:(NSString *)name body:(id)body {
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

- (BOOL)isIOS89 {
  return floor(NSFoundationVersionNumber) <= NSFoundationVersionNumber_iOS_9_x_Max;
}

- (UILocalNotification*) buildUILocalNotification:(NSDictionary *) notification
                                     withSchedule:(BOOL) withSchedule {
  UILocalNotification *localNotification = [[UILocalNotification alloc] init];
  if (notification[@"body"]) {
    localNotification.alertBody = notification[@"body"];
  }
  if (notification[@"data"]) {
    localNotification.userInfo = notification[@"data"];
  }
  if (notification[@"sound"]) {
    localNotification.soundName = notification[@"sound"];
  }
  if (notification[@"title"]) {
    localNotification.alertTitle = notification[@"title"];
  }
  if (notification[@"ios"]) {
    NSDictionary *ios = notification[@"ios"];
    if (ios[@"alertAction"]) {
      localNotification.alertAction = ios[@"alertAction"];
    }
    if (ios[@"badge"]) {
      NSNumber *badge = ios[@"badge"];
      localNotification.applicationIconBadgeNumber = badge.integerValue;
    }
    if (ios[@"category"]) {
      localNotification.category = ios[@"category"];
    }
    if (ios[@"hasAction"]) {
      localNotification.hasAction = ios[@"hasAction"];
    }
    if (ios[@"launchImage"]) {
      localNotification.alertLaunchImage = ios[@"launchImage"];
    }
  }
  if (withSchedule) {
    NSDictionary *schedule = notification[@"schedule"];
    NSNumber *fireDateNumber = schedule[@"fireDate"];
    NSDate *fireDate = [NSDate dateWithTimeIntervalSince1970:([fireDateNumber doubleValue] / 1000.0)];
    localNotification.fireDate = fireDate;
    
    NSString *interval = schedule[@"repeatInterval"];
    if (interval) {
      if ([interval isEqualToString:@"minute"]) {
        localNotification.repeatInterval = NSCalendarUnitMinute;
      } else if ([interval isEqualToString:@"hour"]) {
        localNotification.repeatInterval = NSCalendarUnitHour;
      } else if ([interval isEqualToString:@"day"]) {
        localNotification.repeatInterval = NSCalendarUnitDay;
      } else if ([interval isEqualToString:@"week"]) {
        localNotification.repeatInterval = NSCalendarUnitWeekday;
      }
    }
    
  }
  
  return localNotification;
}

- (UNNotificationRequest*) buildUNNotificationRequest:(NSDictionary *) notification
                                         withSchedule:(BOOL) withSchedule NS_AVAILABLE_IOS(10_0) {
  UNMutableNotificationContent *content = [[UNMutableNotificationContent alloc] init];
  if (notification[@"body"]) {
    content.body = notification[@"body"];
  }
  if (notification[@"data"]) {
    content.userInfo = notification[@"data"];
  }
  if (notification[@"sound"]) {
    if ([@"default" isEqualToString:notification[@"sound"]]) {
      content.sound = [UNNotificationSound defaultSound];
    } else {
      content.sound = [UNNotificationSound soundNamed:notification[@"sound"]];
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
      }
    } else {
      // Needs to match exactly to the secpmd
      calendarUnit = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
    }
    
    NSDateComponents *components = [[NSCalendar currentCalendar] components:calendarUnit fromDate:fireDate];
    UNCalendarNotificationTrigger *trigger = [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:components repeats:interval];
    return [UNNotificationRequest requestWithIdentifier:notification[@"notificationId"] content:content trigger:trigger];
  } else {
    return [UNNotificationRequest requestWithIdentifier:notification[@"notificationId"] content:content trigger:nil];
  }
}

- (NSDictionary*) parseUILocalNotification:(UILocalNotification *) localNotification {
  NSMutableDictionary *notification = [[NSMutableDictionary alloc] init];
  
  if (localNotification.alertBody) {
    notification[@"body"] = localNotification.alertBody;
  }
  if (localNotification.userInfo) {
    notification[@"data"] = localNotification.userInfo;
  }
  if (localNotification.soundName) {
    notification[@"sound"] = localNotification.soundName;
  }
  if (localNotification.alertTitle) {
    notification[@"title"] = localNotification.alertTitle;
  }
  
  NSMutableDictionary *ios = [[NSMutableDictionary alloc] init];
  if (localNotification.alertAction) {
    ios[@"alertAction"] = localNotification.alertAction;
  }
  if (localNotification.applicationIconBadgeNumber) {
    ios[@"badge"] = @(localNotification.applicationIconBadgeNumber);
  }
  if (localNotification.category) {
    ios[@"category"] = localNotification.category;
  }
  if (localNotification.hasAction) {
    ios[@"hasAction"] = @(localNotification.hasAction);
  }
  if (localNotification.alertLaunchImage) {
    ios[@"launchImage"] = localNotification.alertLaunchImage;
  }
  notification[@"ios"] = ios;
  
  return notification;
}

- (NSDictionary*)parseUNNotificationResponse:(UNNotificationResponse *)response NS_AVAILABLE_IOS(10_0) {
  NSMutableDictionary *notificationResponse = [[NSMutableDictionary alloc] init];
  NSDictionary *notification = [self parseUNNotification:response.notification];
  notificationResponse[@"notification"] = notification;
  notificationResponse[@"action"] = response.actionIdentifier;
  
  return notificationResponse;
}

- (NSDictionary*)parseUNNotification:(UNNotification *)notification NS_AVAILABLE_IOS(10_0) {
  return [self parseUNNotificationRequest:notification.request];
}

- (NSDictionary*) parseUNNotificationRequest:(UNNotificationRequest *) notificationRequest NS_AVAILABLE_IOS(10_0) {
  NSMutableDictionary *notification = [[NSMutableDictionary alloc] init];
  
  notification[@"notificationId"] = notificationRequest.identifier;
  
  if (notificationRequest.content.body) {
    notification[@"body"] = notificationRequest.content.body;
  }
  if (notificationRequest.content.userInfo) {
    NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
    for (id k in notificationRequest.content.userInfo) {
      if ([k isEqualToString:@"aps"]
          || [k isEqualToString:@"gcm.message_id"]) {
        // ignore as these are handled by the OS
      } else {
        data[k] = notificationRequest.content.userInfo[k];
      }
    }
    notification[@"data"] = data;
  }
  if (notificationRequest.content.sound) {
    notification[@"sound"] = notificationRequest.content.sound;
  }
  if (notificationRequest.content.subtitle) {
    notification[@"subtitle"] = notificationRequest.content.subtitle;
  }
  if (notificationRequest.content.title) {
    notification[@"title"] = notificationRequest.content.title;
  }
  
  NSMutableDictionary *ios = [[NSMutableDictionary alloc] init];
  
  if (notificationRequest.content.attachments) {
    NSMutableArray *attachments = [[NSMutableArray alloc] init];
    for (UNNotificationAttachment *a in notificationRequest.content.attachments) {
      NSMutableDictionary *attachment = [[NSMutableDictionary alloc] init];
      attachment[@"identifier"] = a.identifier;
      attachment[@"type"] = a.type;
      attachment[@"url"] = [a.URL absoluteString];
      [attachments addObject:attachment];
    }
    ios[@"attachments"] = attachments;
  }
  
  if (notificationRequest.content.badge) {
    ios[@"badge"] = notificationRequest.content.badge;
  }
  if (notificationRequest.content.categoryIdentifier) {
    ios[@"category"] = notificationRequest.content.categoryIdentifier;
  }
  if (notificationRequest.content.launchImageName) {
    ios[@"launchImage"] = notificationRequest.content.launchImageName;
  }
  if (notificationRequest.content.threadIdentifier) {
    ios[@"threadIdentifier"] = notificationRequest.content.threadIdentifier;
  }
  notification[@"ios"] = ios;
  
  return notification;
}

- (NSDictionary*)parseUserInfo:(NSDictionary *)userInfo {
  
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

- (NSArray<NSString *> *)supportedEvents {
  return @[NOTIFICATIONS_NOTIFICATION_DISPLAYED, NOTIFICATIONS_NOTIFICATION_OPENED, NOTIFICATIONS_NOTIFICATION_RECEIVED];
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end

#else
@implementation RNFirebaseNotifications
@end
#endif
