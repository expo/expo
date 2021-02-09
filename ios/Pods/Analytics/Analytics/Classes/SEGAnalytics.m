#import <objc/runtime.h>
#import "SEGAnalyticsUtils.h"
#import "SEGAnalytics.h"
#import "SEGIntegrationFactory.h"
#import "SEGIntegration.h"
#import "SEGSegmentIntegrationFactory.h"
#import "UIViewController+SEGScreen.h"
#import "NSViewController+SEGScreen.h"
#import "SEGStoreKitTracker.h"
#import "SEGHTTPClient.h"
#import "SEGStorage.h"
#import "SEGFileStorage.h"
#import "SEGUserDefaultsStorage.h"
#import "SEGMiddleware.h"
#import "SEGContext.h"
#import "SEGIntegrationsManager.h"
#import "SEGState.h"
#import "SEGUtils.h"

static SEGAnalytics *__sharedInstance = nil;


@interface SEGAnalytics ()

@property (nonatomic, assign) BOOL enabled;
@property (nonatomic, strong) SEGAnalyticsConfiguration *configuration;
@property (nonatomic, strong) SEGStoreKitTracker *storeKitTracker;
@property (nonatomic, strong) SEGIntegrationsManager *integrationsManager;
@property (nonatomic, strong) SEGMiddlewareRunner *runner;

@end


@implementation SEGAnalytics

+ (void)setupWithConfiguration:(SEGAnalyticsConfiguration *)configuration
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        __sharedInstance = [[self alloc] initWithConfiguration:configuration];
    });
}

- (instancetype)initWithConfiguration:(SEGAnalyticsConfiguration *)configuration
{
    NSCParameterAssert(configuration != nil);

    if (self = [self init]) {
        self.configuration = configuration;
        self.enabled = YES;

        // In swift this would not have been OK... But hey.. It's objc
        // TODO: Figure out if this is really the best way to do things here.
        self.integrationsManager = [[SEGIntegrationsManager alloc] initWithAnalytics:self];

        self.runner = [[SEGMiddlewareRunner alloc] initWithMiddleware:
                                                       [configuration.sourceMiddleware ?: @[] arrayByAddingObject:self.integrationsManager]];

        // Pass through for application state change events
        id<SEGApplicationProtocol> application = configuration.application;
        if (application) {
#if TARGET_OS_IPHONE
            // Attach to application state change hooks
            NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
            for (NSString *name in @[ UIApplicationDidEnterBackgroundNotification,
                                      UIApplicationDidFinishLaunchingNotification,
                                      UIApplicationWillEnterForegroundNotification,
                                      UIApplicationWillTerminateNotification,
                                      UIApplicationWillResignActiveNotification,
                                      UIApplicationDidBecomeActiveNotification ]) {
                [nc addObserver:self selector:@selector(handleAppStateNotification:) name:name object:application];
            }
#elif TARGET_OS_OSX
            // Attach to application state change hooks
            NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
            for (NSString *name in @[ NSApplicationWillUnhideNotification,
                                      NSApplicationDidFinishLaunchingNotification,
                                      NSApplicationWillResignActiveNotification,
                                      NSApplicationDidHideNotification,
                                      NSApplicationDidBecomeActiveNotification,
                                      NSApplicationWillTerminateNotification]) {
                [nc addObserver:self selector:@selector(handleAppStateNotification:) name:name object:application];
            }
#endif
        }

#if TARGET_OS_IPHONE
        if (configuration.recordScreenViews) {
            [UIViewController seg_swizzleViewDidAppear];
        }
#elif TARGET_OS_OSX
        if (configuration.recordScreenViews) {
            [NSViewController seg_swizzleViewDidAppear];
        }
#endif
        if (configuration.trackInAppPurchases) {
            _storeKitTracker = [SEGStoreKitTracker trackTransactionsForAnalytics:self];
        }

#if !TARGET_OS_TV
        if (configuration.trackPushNotifications && configuration.launchOptions) {
#if TARGET_OS_IOS
            NSDictionary *remoteNotification = configuration.launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey];
#else
            NSDictionary *remoteNotification = configuration.launchOptions[NSApplicationLaunchUserNotificationKey];
#endif
            if (remoteNotification) {
                [self trackPushNotification:remoteNotification fromLaunch:YES];
            }
        }
#endif
        
        [SEGState sharedInstance].configuration = configuration;
        [[SEGState sharedInstance].context updateStaticContext];
    }
    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark -

NSString *const SEGVersionKey = @"SEGVersionKey";
NSString *const SEGBuildKeyV1 = @"SEGBuildKey";
NSString *const SEGBuildKeyV2 = @"SEGBuildKeyV2";

#if TARGET_OS_IPHONE
- (void)handleAppStateNotification:(NSNotification *)note
{
    SEGApplicationLifecyclePayload *payload = [[SEGApplicationLifecyclePayload alloc] init];
    payload.notificationName = note.name;
    [self run:SEGEventTypeApplicationLifecycle payload:payload];

    if ([note.name isEqualToString:UIApplicationDidFinishLaunchingNotification]) {
        [self _applicationDidFinishLaunchingWithOptions:note.userInfo];
    } else if ([note.name isEqualToString:UIApplicationWillEnterForegroundNotification]) {
        [self _applicationWillEnterForeground];
    } else if ([note.name isEqualToString: UIApplicationDidEnterBackgroundNotification]) {
      [self _applicationDidEnterBackground];
    }
}
#elif TARGET_OS_OSX
- (void)handleAppStateNotification:(NSNotification *)note
{
    SEGApplicationLifecyclePayload *payload = [[SEGApplicationLifecyclePayload alloc] init];
    payload.notificationName = note.name;
    [self run:SEGEventTypeApplicationLifecycle payload:payload];

    if ([note.name isEqualToString:NSApplicationDidFinishLaunchingNotification]) {
        [self _applicationDidFinishLaunchingWithOptions:note.userInfo];
    } else if ([note.name isEqualToString:NSApplicationWillUnhideNotification]) {
        [self _applicationWillEnterForeground];
    } else if ([note.name isEqualToString: NSApplicationDidHideNotification]) {
      [self _applicationDidEnterBackground];
    }
}
#endif

- (void)_applicationDidFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    if (!self.configuration.trackApplicationLifecycleEvents) {
        return;
    }
    // Previously SEGBuildKey was stored an integer. This was incorrect because the CFBundleVersion
    // can be a string. This migrates SEGBuildKey to be stored as a string.
    NSInteger previousBuildV1 = [[NSUserDefaults standardUserDefaults] integerForKey:SEGBuildKeyV1];
    if (previousBuildV1) {
        [[NSUserDefaults standardUserDefaults] setObject:[@(previousBuildV1) stringValue] forKey:SEGBuildKeyV2];
        [[NSUserDefaults standardUserDefaults] removeObjectForKey:SEGBuildKeyV1];
    }

    NSString *previousVersion = [[NSUserDefaults standardUserDefaults] stringForKey:SEGVersionKey];
    NSString *previousBuildV2 = [[NSUserDefaults standardUserDefaults] stringForKey:SEGBuildKeyV2];

    NSString *currentVersion = [[NSBundle mainBundle] infoDictionary][@"CFBundleShortVersionString"];
    NSString *currentBuild = [[NSBundle mainBundle] infoDictionary][@"CFBundleVersion"];

    if (!previousBuildV2) {
        [self track:@"Application Installed" properties:@{
            @"version" : currentVersion ?: @"",
            @"build" : currentBuild ?: @"",
        }];
    } else if (![currentBuild isEqualToString:previousBuildV2]) {
        [self track:@"Application Updated" properties:@{
            @"previous_version" : previousVersion ?: @"",
            @"previous_build" : previousBuildV2 ?: @"",
            @"version" : currentVersion ?: @"",
            @"build" : currentBuild ?: @"",
        }];
    }

#if TARGET_OS_IPHONE
    [self track:@"Application Opened" properties:@{
        @"from_background" : @NO,
        @"version" : currentVersion ?: @"",
        @"build" : currentBuild ?: @"",
        @"referring_application" : launchOptions[UIApplicationLaunchOptionsSourceApplicationKey] ?: @"",
        @"url" : launchOptions[UIApplicationLaunchOptionsURLKey] ?: @"",
    }];
#elif TARGET_OS_OSX
    [self track:@"Application Opened" properties:@{
        @"from_background" : @NO,
        @"version" : currentVersion ?: @"",
        @"build" : currentBuild ?: @"",
        @"default_launch" : launchOptions[NSApplicationLaunchIsDefaultLaunchKey] ?: @(YES),
    }];
#endif


    [[NSUserDefaults standardUserDefaults] setObject:currentVersion forKey:SEGVersionKey];
    [[NSUserDefaults standardUserDefaults] setObject:currentBuild forKey:SEGBuildKeyV2];

    [[NSUserDefaults standardUserDefaults] synchronize];
}

- (void)_applicationWillEnterForeground
{
    if (!self.configuration.trackApplicationLifecycleEvents) {
        return;
    }
    NSString *currentVersion = [[NSBundle mainBundle] infoDictionary][@"CFBundleShortVersionString"];
    NSString *currentBuild = [[NSBundle mainBundle] infoDictionary][@"CFBundleVersion"];
    [self track:@"Application Opened" properties:@{
        @"from_background" : @YES,
        @"version" : currentVersion ?: @"",
        @"build" : currentBuild ?: @"",
    }];
    
    [[SEGState sharedInstance].context updateStaticContext];
}

- (void)_applicationDidEnterBackground
{
  if (!self.configuration.trackApplicationLifecycleEvents) {
    return;
  }
  [self track: @"Application Backgrounded"];
}


#pragma mark - Public API

- (NSString *)description
{
    return [NSString stringWithFormat:@"<%p:%@, %@>", self, [self class], [self dictionaryWithValuesForKeys:@[ @"configuration" ]]];
}

#pragma mark - Identify

- (void)identify:(NSString *)userId
{
    [self identify:userId traits:nil options:nil];
}

- (void)identify:(NSString *)userId traits:(NSDictionary *)traits
{
    [self identify:userId traits:traits options:nil];
}

- (void)identify:(NSString *)userId traits:(NSDictionary *)traits options:(NSDictionary *)options
{
    NSCAssert2(userId.length > 0 || traits.count > 0, @"either userId (%@) or traits (%@) must be provided.", userId, traits);
    
    // this is done here to match functionality on android where these are inserted BEFORE being spread out amongst destinations.
    // it will be set globally later when it runs through SEGIntegrationManager.identify.
    NSString *anonId = [options objectForKey:@"anonymousId"];
    if (anonId == nil) {
        anonId = [self getAnonymousId];
    }
    // configure traits to match what is seen on android.
    NSMutableDictionary *existingTraitsCopy = [[SEGState sharedInstance].userInfo.traits mutableCopy];
    NSMutableDictionary *traitsCopy = [traits mutableCopy];
    // if no traits were passed in, need to create.
    if (existingTraitsCopy == nil) {
        existingTraitsCopy = [[NSMutableDictionary alloc] init];
    }
    if (traitsCopy == nil) {
        traitsCopy = [[NSMutableDictionary alloc] init];
    }
    traitsCopy[@"anonymousId"] = anonId;
    if (userId != nil) {
        traitsCopy[@"userId"] = userId;
        [SEGState sharedInstance].userInfo.userId = userId;
    }
    // merge w/ existing traits and set them.
    [existingTraitsCopy addEntriesFromDictionary:traits];
    [SEGState sharedInstance].userInfo.traits = existingTraitsCopy;
    
    [self run:SEGEventTypeIdentify payload:
                                       [[SEGIdentifyPayload alloc] initWithUserId:userId
                                                                      anonymousId:anonId
                                                                           traits:SEGCoerceDictionary(existingTraitsCopy)
                                                                          context:SEGCoerceDictionary([options objectForKey:@"context"])
                                                                     integrations:[options objectForKey:@"integrations"]]];
}

#pragma mark - Track

- (void)track:(NSString *)event
{
    [self track:event properties:nil options:nil];
}

- (void)track:(NSString *)event properties:(NSDictionary *)properties
{
    [self track:event properties:properties options:nil];
}

- (void)track:(NSString *)event properties:(NSDictionary *)properties options:(NSDictionary *)options
{
    NSCAssert1(event.length > 0, @"event (%@) must not be empty.", event);
    [self run:SEGEventTypeTrack payload:
                                    [[SEGTrackPayload alloc] initWithEvent:event
                                                                properties:SEGCoerceDictionary(properties)
                                                                   context:SEGCoerceDictionary([options objectForKey:@"context"])
                                                              integrations:[options objectForKey:@"integrations"]]];
}

#pragma mark - Screen

- (void)screen:(NSString *)screenTitle
{
    [self screen:screenTitle properties:nil options:nil];
}

- (void)screen:(NSString *)screenTitle properties:(NSDictionary *)properties
{
    [self screen:screenTitle properties:properties options:nil];
}

- (void)screen:(NSString *)screenTitle properties:(NSDictionary *)properties options:(NSDictionary *)options
{
    NSCAssert1(screenTitle.length > 0, @"screen name (%@) must not be empty.", screenTitle);

    [self run:SEGEventTypeScreen payload:
                                     [[SEGScreenPayload alloc] initWithName:screenTitle
                                                                 properties:SEGCoerceDictionary(properties)
                                                                    context:SEGCoerceDictionary([options objectForKey:@"context"])
                                                               integrations:[options objectForKey:@"integrations"]]];
}

#pragma mark - Group

- (void)group:(NSString *)groupId
{
    [self group:groupId traits:nil options:nil];
}

- (void)group:(NSString *)groupId traits:(NSDictionary *)traits
{
    [self group:groupId traits:traits options:nil];
}

- (void)group:(NSString *)groupId traits:(NSDictionary *)traits options:(NSDictionary *)options
{
    [self run:SEGEventTypeGroup payload:
                                    [[SEGGroupPayload alloc] initWithGroupId:groupId
                                                                      traits:SEGCoerceDictionary(traits)
                                                                     context:SEGCoerceDictionary([options objectForKey:@"context"])
                                                                integrations:[options objectForKey:@"integrations"]]];
}

#pragma mark - Alias

- (void)alias:(NSString *)newId
{
    [self alias:newId options:nil];
}

- (void)alias:(NSString *)newId options:(NSDictionary *)options
{
    [self run:SEGEventTypeAlias payload:
                                    [[SEGAliasPayload alloc] initWithNewId:newId
                                                                   context:SEGCoerceDictionary([options objectForKey:@"context"])
                                                              integrations:[options objectForKey:@"integrations"]]];
}

- (void)trackPushNotification:(NSDictionary *)properties fromLaunch:(BOOL)launch
{
    if (launch) {
        [self track:@"Push Notification Tapped" properties:properties];
    } else {
        [self track:@"Push Notification Received" properties:properties];
    }
}

- (void)receivedRemoteNotification:(NSDictionary *)userInfo
{
    if (self.configuration.trackPushNotifications) {
        [self trackPushNotification:userInfo fromLaunch:NO];
    }
    SEGRemoteNotificationPayload *payload = [[SEGRemoteNotificationPayload alloc] init];
    payload.userInfo = userInfo;
    [self run:SEGEventTypeReceivedRemoteNotification payload:payload];
}

- (void)failedToRegisterForRemoteNotificationsWithError:(NSError *)error
{
    SEGRemoteNotificationPayload *payload = [[SEGRemoteNotificationPayload alloc] init];
    payload.error = error;
    [self run:SEGEventTypeFailedToRegisterForRemoteNotifications payload:payload];
}

- (void)registeredForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
    NSParameterAssert(deviceToken != nil);
    SEGRemoteNotificationPayload *payload = [[SEGRemoteNotificationPayload alloc] init];
    payload.deviceToken = deviceToken;
    [SEGState sharedInstance].context.deviceToken = deviceTokenToString(deviceToken);
    [self run:SEGEventTypeRegisteredForRemoteNotifications payload:payload];
}

- (void)handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo
{
    SEGRemoteNotificationPayload *payload = [[SEGRemoteNotificationPayload alloc] init];
    payload.actionIdentifier = identifier;
    payload.userInfo = userInfo;
    [self run:SEGEventTypeHandleActionWithForRemoteNotification payload:payload];
}

- (void)continueUserActivity:(NSUserActivity *)activity
{
    SEGContinueUserActivityPayload *payload = [[SEGContinueUserActivityPayload alloc] init];
    payload.activity = activity;
    [self run:SEGEventTypeContinueUserActivity payload:payload];

    if (!self.configuration.trackDeepLinks) {
        return;
    }

    if ([activity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
        NSString *urlString = activity.webpageURL.absoluteString;
        [SEGState sharedInstance].context.referrer = @{
            @"url" : urlString,
        };

        NSMutableDictionary *properties = [NSMutableDictionary dictionaryWithCapacity:activity.userInfo.count + 2];
        [properties addEntriesFromDictionary:activity.userInfo];
        properties[@"url"] = urlString;
        properties[@"title"] = activity.title ?: @"";
        properties = [SEGUtils traverseJSON:properties
                      andReplaceWithFilters:self.configuration.payloadFilters];
        [self track:@"Deep Link Opened" properties:[properties copy]];
    }
}

- (void)openURL:(NSURL *)url options:(NSDictionary *)options
{
    SEGOpenURLPayload *payload = [[SEGOpenURLPayload alloc] init];
    payload.url = [NSURL URLWithString:[SEGUtils traverseJSON:url.absoluteString
                                        andReplaceWithFilters:self.configuration.payloadFilters]];
    payload.options = options;
    [self run:SEGEventTypeOpenURL payload:payload];

    if (!self.configuration.trackDeepLinks) {
        return;
    }
    
    NSString *urlString = url.absoluteString;
    [SEGState sharedInstance].context.referrer = @{
        @"url" : urlString,
    };

    NSMutableDictionary *properties = [NSMutableDictionary dictionaryWithCapacity:options.count + 2];
    [properties addEntriesFromDictionary:options];
    properties[@"url"] = urlString;
    properties = [SEGUtils traverseJSON:properties
                  andReplaceWithFilters:self.configuration.payloadFilters];
    [self track:@"Deep Link Opened" properties:[properties copy]];
}

- (void)reset
{
    [self run:SEGEventTypeReset payload:nil];
}

- (void)flush
{
    [self run:SEGEventTypeFlush payload:nil];
}

- (void)enable
{
    _enabled = YES;
}

- (void)disable
{
    _enabled = NO;
}

- (NSString *)getAnonymousId
{
    return [SEGState sharedInstance].userInfo.anonymousId;
}

- (NSString *)getDeviceToken
{
    return [SEGState sharedInstance].context.deviceToken;
}

- (NSDictionary *)bundledIntegrations
{
    return [self.integrationsManager.registeredIntegrations copy];
}

#pragma mark - Class Methods

+ (instancetype)sharedAnalytics
{
    NSCAssert(__sharedInstance != nil, @"library must be initialized before calling this method.");
    return __sharedInstance;
}

+ (void)debug:(BOOL)showDebugLogs
{
    SEGSetShowDebugLogs(showDebugLogs);
}

+ (NSString *)version
{
    // this has to match the actual version, NOT what's in info.plist
    // because Apple only accepts X.X.X as versions in the review process.
    return @"4.0.4";
}

#pragma mark - Helpers

- (void)run:(SEGEventType)eventType payload:(SEGPayload *)payload
{
    if (!self.enabled) {
        return;
    }
    
    if (self.configuration.experimental.nanosecondTimestamps) {
        payload.timestamp = iso8601NanoFormattedString([NSDate date]);
    } else {
        payload.timestamp = iso8601FormattedString([NSDate date]);
    }
    
    SEGContext *context = [[[SEGContext alloc] initWithAnalytics:self] modify:^(id<SEGMutableContext> _Nonnull ctx) {
        ctx.eventType = eventType;
        ctx.payload = payload;
        ctx.payload.messageId = GenerateUUIDString();
        if (ctx.payload.userId == nil) {
            ctx.payload.userId = [SEGState sharedInstance].userInfo.userId;
        }
        if (ctx.payload.anonymousId == nil) {
            ctx.payload.anonymousId = [SEGState sharedInstance].userInfo.anonymousId;
        }
    }];
    
    // Could probably do more things with callback later, but we don't use it yet.
    [self.runner run:context callback:nil];
}

@end
