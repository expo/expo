//
//  SEGIntegrationsManager.m
//  Analytics
//
//  Created by Tony Xiao on 9/20/16.
//  Copyright © 2016 Segment. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <objc/runtime.h>
#import "SEGAnalyticsUtils.h"
#import "SEGAnalytics.h"
#import "SEGIntegrationFactory.h"
#import "SEGIntegration.h"
#import "SEGHTTPClient.h"
#import "SEGStorage.h"
#import "SEGFileStorage.h"
#import "SEGUserDefaultsStorage.h"
#import "SEGIntegrationsManager.h"
#import "SEGSegmentIntegrationFactory.h"
#import "SEGPayload.h"
#import "SEGIdentifyPayload.h"
#import "SEGTrackPayload.h"
#import "SEGGroupPayload.h"
#import "SEGScreenPayload.h"
#import "SEGAliasPayload.h"

NSString *SEGAnalyticsIntegrationDidStart = @"io.segment.analytics.integration.did.start";
static NSString *const SEGAnonymousIdKey = @"SEGAnonymousId";
static NSString *const kSEGAnonymousIdFilename = @"segment.anonymousId";


@interface SEGAnalyticsConfiguration (Private)

@property (nonatomic, strong) NSArray *factories;

@end


@interface SEGIntegrationsManager ()

@property (nonatomic, strong) SEGAnalytics *analytics;
@property (nonatomic, strong) NSDictionary *cachedSettings;
@property (nonatomic, strong) SEGAnalyticsConfiguration *configuration;
@property (nonatomic, strong) dispatch_queue_t serialQueue;
@property (nonatomic, strong) NSMutableArray *messageQueue;
@property (nonatomic, strong) NSArray *factories;
@property (nonatomic, strong) NSMutableDictionary *integrations;
@property (nonatomic, strong) NSMutableDictionary *registeredIntegrations;
@property (nonatomic) volatile BOOL initialized;
@property (nonatomic, copy) NSString *cachedAnonymousId;
@property (nonatomic, strong) SEGHTTPClient *httpClient;
@property (nonatomic, strong) NSURLSessionDataTask *settingsRequest;
@property (nonatomic, strong) id<SEGStorage> storage;

@end


@implementation SEGIntegrationsManager

@synthesize cachedSettings = _cachedSettings;

- (instancetype _Nonnull)initWithAnalytics:(SEGAnalytics *_Nonnull)analytics
{
    SEGAnalyticsConfiguration *configuration = analytics.configuration;
    NSCParameterAssert(configuration != nil);

    if (self = [super init]) {
        self.analytics = analytics;
        self.configuration = configuration;
        self.serialQueue = seg_dispatch_queue_create_specific("io.segment.analytics", DISPATCH_QUEUE_SERIAL);
        self.messageQueue = [[NSMutableArray alloc] init];
        self.httpClient = [[SEGHTTPClient alloc] initWithRequestFactory:configuration.requestFactory];
#if TARGET_OS_TV
        self.storage = [[SEGUserDefaultsStorage alloc] initWithDefaults:[NSUserDefaults standardUserDefaults] namespacePrefix:nil crypto:configuration.crypto];
#else
        self.storage = [[SEGFileStorage alloc] initWithFolder:[SEGFileStorage applicationSupportDirectoryURL] crypto:configuration.crypto];
#endif
        self.cachedAnonymousId = [self loadOrGenerateAnonymousID:NO];
        NSMutableArray *factories = [[configuration factories] mutableCopy];
        [factories addObject:[[SEGSegmentIntegrationFactory alloc] initWithHTTPClient:self.httpClient storage:self.storage]];
        self.factories = [factories copy];
        self.integrations = [NSMutableDictionary dictionaryWithCapacity:factories.count];
        self.registeredIntegrations = [NSMutableDictionary dictionaryWithCapacity:factories.count];

        // Update settings on each integration immediately
        [self refreshSettings];

        // Attach to application state change hooks
        NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];

        // Update settings on foreground
        id<SEGApplicationProtocol> application = configuration.application;
        if (application) {
            [nc addObserver:self selector:@selector(onAppForeground:) name:UIApplicationWillEnterForegroundNotification object:application];
        }
    }
    return self;
}


- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}


- (void)onAppForeground:(NSNotification *)note
{
    [self refreshSettings];
}


- (void)handleAppStateNotification:(NSString *)notificationName
{
    SEGLog(@"Application state change notification: %@", notificationName);
    static NSDictionary *selectorMapping;
    static dispatch_once_t selectorMappingOnce;
    dispatch_once(&selectorMappingOnce, ^{
        selectorMapping = @{
            UIApplicationDidFinishLaunchingNotification :
                NSStringFromSelector(@selector(applicationDidFinishLaunching:)),
            UIApplicationDidEnterBackgroundNotification :
                NSStringFromSelector(@selector(applicationDidEnterBackground)),
            UIApplicationWillEnterForegroundNotification :
                NSStringFromSelector(@selector(applicationWillEnterForeground)),
            UIApplicationWillTerminateNotification :
                NSStringFromSelector(@selector(applicationWillTerminate)),
            UIApplicationWillResignActiveNotification :
                NSStringFromSelector(@selector(applicationWillResignActive)),
            UIApplicationDidBecomeActiveNotification :
                NSStringFromSelector(@selector(applicationDidBecomeActive))
        };
    });
    SEL selector = NSSelectorFromString(selectorMapping[notificationName]);
    if (selector) {
        [self callIntegrationsWithSelector:selector arguments:nil options:nil sync:true];
    }
}


#pragma mark - Public API

- (NSString *)description
{
    return [NSString stringWithFormat:@"<%p:%@, %@>", self, [self class], [self dictionaryWithValuesForKeys:@[ @"configuration" ]]];
}

#pragma mark - Analytics API

- (void)identify:(NSString *)userId traits:(NSDictionary *)traits options:(NSDictionary *)options
{
    NSCAssert2(userId.length > 0 || traits.count > 0, @"either userId (%@) or traits (%@) must be provided.", userId, traits);

    NSString *anonymousId = [options objectForKey:@"anonymousId"];
    if (anonymousId) {
        [self saveAnonymousId:anonymousId];
    } else {
        anonymousId = self.cachedAnonymousId;
    }

    SEGIdentifyPayload *payload = [[SEGIdentifyPayload alloc] initWithUserId:userId
                                                                 anonymousId:anonymousId
                                                                      traits:SEGCoerceDictionary(traits)
                                                                     context:SEGCoerceDictionary([options objectForKey:@"context"])
                                                                integrations:[options objectForKey:@"integrations"]];

    [self callIntegrationsWithSelector:NSSelectorFromString(@"identify:")
                             arguments:@[ payload ]
                               options:options
                                  sync:false];
}

#pragma mark - Track

- (void)track:(NSString *)event properties:(NSDictionary *)properties options:(NSDictionary *)options
{
    NSCAssert1(event.length > 0, @"event (%@) must not be empty.", event);

    SEGTrackPayload *payload = [[SEGTrackPayload alloc] initWithEvent:event
                                                           properties:SEGCoerceDictionary(properties)
                                                              context:SEGCoerceDictionary([options objectForKey:@"context"])
                                                         integrations:[options objectForKey:@"integrations"]];

    [self callIntegrationsWithSelector:NSSelectorFromString(@"track:")
                             arguments:@[ payload ]
                               options:options
                                  sync:false];
}

#pragma mark - Screen

- (void)screen:(NSString *)screenTitle properties:(NSDictionary *)properties options:(NSDictionary *)options
{
    NSCAssert1(screenTitle.length > 0, @"screen name (%@) must not be empty.", screenTitle);

    SEGScreenPayload *payload = [[SEGScreenPayload alloc] initWithName:screenTitle
                                                            properties:SEGCoerceDictionary(properties)
                                                               context:SEGCoerceDictionary([options objectForKey:@"context"])
                                                          integrations:[options objectForKey:@"integrations"]];

    [self callIntegrationsWithSelector:NSSelectorFromString(@"screen:")
                             arguments:@[ payload ]
                               options:options
                                  sync:false];
}

#pragma mark - Group

- (void)group:(NSString *)groupId traits:(NSDictionary *)traits options:(NSDictionary *)options
{
    SEGGroupPayload *payload = [[SEGGroupPayload alloc] initWithGroupId:groupId
                                                                 traits:SEGCoerceDictionary(traits)
                                                                context:SEGCoerceDictionary([options objectForKey:@"context"])
                                                           integrations:[options objectForKey:@"integrations"]];

    [self callIntegrationsWithSelector:NSSelectorFromString(@"group:")
                             arguments:@[ payload ]
                               options:options
                                  sync:false];
}

#pragma mark - Alias

- (void)alias:(NSString *)newId options:(NSDictionary *)options
{
    SEGAliasPayload *payload = [[SEGAliasPayload alloc] initWithNewId:newId
                                                              context:SEGCoerceDictionary([options objectForKey:@"context"])
                                                         integrations:[options objectForKey:@"integrations"]];

    [self callIntegrationsWithSelector:NSSelectorFromString(@"alias:")
                             arguments:@[ payload ]
                               options:options
                                  sync:false];
}

- (void)receivedRemoteNotification:(NSDictionary *)userInfo
{
    [self callIntegrationsWithSelector:_cmd arguments:@[ userInfo ] options:nil sync:true];
}

- (void)failedToRegisterForRemoteNotificationsWithError:(NSError *)error
{
    [self callIntegrationsWithSelector:_cmd arguments:@[ error ] options:nil sync:true];
}

- (void)registeredForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
    NSParameterAssert(deviceToken != nil);

    [self callIntegrationsWithSelector:_cmd arguments:@[ deviceToken ] options:nil sync:true];
}

- (void)handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo
{
    [self callIntegrationsWithSelector:_cmd arguments:@[ identifier, userInfo ] options:nil sync:true];
}

- (void)continueUserActivity:(NSUserActivity *)activity
{
    [self callIntegrationsWithSelector:_cmd arguments:@[ activity ] options:nil sync:true];
}

- (void)openURL:(NSURL *)url options:(NSDictionary *)options
{
    [self callIntegrationsWithSelector:_cmd arguments:@[ url, options ] options:nil sync:true];
}

- (void)reset
{
    [self resetAnonymousId];
    [self callIntegrationsWithSelector:_cmd arguments:nil options:nil sync:false];
}

- (void)resetAnonymousId
{
    self.cachedAnonymousId = [self loadOrGenerateAnonymousID:YES];
}

- (NSString *)getAnonymousId;
{
    return self.cachedAnonymousId;
}

- (NSString *)loadOrGenerateAnonymousID:(BOOL)reset
{
#if TARGET_OS_TV
    NSString *anonymousId = [self.storage stringForKey:SEGAnonymousIdKey];
#else
    NSString *anonymousId = [self.storage stringForKey:kSEGAnonymousIdFilename];
#endif

    if (!anonymousId || reset) {
        // We've chosen to generate a UUID rather than use the UDID (deprecated in iOS 5),
        // identifierForVendor (iOS6 and later, can't be changed on logout),
        // or MAC address (blocked in iOS 7). For more info see https://segment.io/libraries/ios#ids
        anonymousId = GenerateUUIDString();
        SEGLog(@"New anonymousId: %@", anonymousId);
#if TARGET_OS_TV
        [self.storage setString:anonymousId forKey:SEGAnonymousIdKey];
#else
        [self.storage setString:anonymousId forKey:kSEGAnonymousIdFilename];
#endif
    }
    return anonymousId;
}

- (void)saveAnonymousId:(NSString *)anonymousId
{
    self.cachedAnonymousId = anonymousId;
#if TARGET_OS_TV
    [self.storage setString:anonymousId forKey:SEGAnonymousIdKey];
#else
    [self.storage setString:anonymousId forKey:@"segment.anonymousId"];
#endif
}

- (void)flush
{
    [self callIntegrationsWithSelector:_cmd arguments:nil options:nil sync:false];
}

#pragma mark - Analytics Settings

- (NSDictionary *)cachedSettings
{
    if (!_cachedSettings)
        _cachedSettings = [self.storage dictionaryForKey:@"analytics.settings.v2.plist"] ?: @{};
    return _cachedSettings;
}

- (void)setCachedSettings:(NSDictionary *)settings
{
    _cachedSettings = [settings copy];
    if (!_cachedSettings) {
        // [@{} writeToURL:settingsURL atomically:YES];
        return;
    }
    [self.storage setDictionary:_cachedSettings forKey:@"analytics.settings.v2.plist"];

    [self updateIntegrationsWithSettings:settings[@"integrations"]];
}

- (void)updateIntegrationsWithSettings:(NSDictionary *)projectSettings
{
    seg_dispatch_specific_sync(_serialQueue, ^{
        if (self.initialized) {
            return;
        }
        for (id<SEGIntegrationFactory> factory in self.factories) {
            NSString *key = [factory key];
            NSDictionary *integrationSettings = [projectSettings objectForKey:key];
            if (integrationSettings) {
                id<SEGIntegration> integration = [factory createWithSettings:integrationSettings forAnalytics:self.analytics];
                if (integration != nil) {
                    self.integrations[key] = integration;
                    self.registeredIntegrations[key] = @NO;
                }
                [[NSNotificationCenter defaultCenter] postNotificationName:SEGAnalyticsIntegrationDidStart object:key userInfo:nil];
            } else {
                SEGLog(@"No settings for %@. Skipping.", key);
            }
        }
        [self flushMessageQueue];
        self.initialized = true;
    });
}

- (void)refreshSettings
{
    seg_dispatch_specific_async(_serialQueue, ^{
        if (self.settingsRequest) {
            return;
        }

        self.settingsRequest = [self.httpClient settingsForWriteKey:self.configuration.writeKey completionHandler:^(BOOL success, NSDictionary *settings) {
            seg_dispatch_specific_async(_serialQueue, ^{
                if (success) {
                    [self setCachedSettings:settings];
                } else {
                    // Hotfix: If settings request fail, fall back to using just Segment integration
                    // Won't catch situation where this callback never gets called - that will get addressed separately in regular dev
                    [self setCachedSettings:@{
                        @"integrations" : @{
                            @"Segment.io" : @{@"apiKey" : self.configuration.writeKey},
                        },
                        @"plan" : @{@"track" : @{}}
                    }];
                }
                self.settingsRequest = nil;
            });
        }];
    });
}

#pragma mark - Private

+ (BOOL)isIntegration:(NSString *)key enabledInOptions:(NSDictionary *)options
{
    // If the event is in the tracking plan, it should always be sent to api.segment.io.
    if ([@"Segment.io" isEqualToString:key]) {
        return YES;
    }
    if (options[key]) {
        return [options[key] boolValue];
    } else if (options[@"All"]) {
        return [options[@"All"] boolValue];
    } else if (options[@"all"]) {
        return [options[@"all"] boolValue];
    }
    return YES;
}

+ (BOOL)isTrackEvent:(NSString *)event enabledForIntegration:(NSString *)key inPlan:(NSDictionary *)plan
{
    // Whether the event is enabled or disabled, it should always be sent to api.segment.io.
    if ([key isEqualToString:@"Segment.io"]) {
        return YES;
    }
    
    if (plan[@"track"][event]) {
        if ([plan[@"track"][event][@"enabled"] boolValue]) {
            return [self isIntegration:key enabledInOptions:plan[@"track"][event][@"integrations"]];
        } else {
            return NO;
        }
    } else if (plan[@"track"][@"__default"]) {
        return [plan[@"track"][@"__default"][@"enabled"] boolValue];
    }

    return YES;
}

- (void)forwardSelector:(SEL)selector arguments:(NSArray *)arguments options:(NSDictionary *)options
{
    [self.integrations enumerateKeysAndObjectsUsingBlock:^(NSString *key, id<SEGIntegration> integration, BOOL *stop) {
        [self invokeIntegration:integration key:key selector:selector arguments:arguments options:options];
    }];
}

- (void)invokeIntegration:(id<SEGIntegration>)integration key:(NSString *)key selector:(SEL)selector arguments:(NSArray *)arguments options:(NSDictionary *)options
{
    if (![integration respondsToSelector:selector]) {
        SEGLog(@"Not sending call to %@ because it doesn't respond to %@.", key, NSStringFromSelector(selector));
        return;
    }

    if (![[self class] isIntegration:key enabledInOptions:options[@"integrations"]]) {
        SEGLog(@"Not sending call to %@ because it is disabled in options.", key);
        return;
    }

    NSString *eventType = NSStringFromSelector(selector);
    if ([eventType hasPrefix:@"track:"]) {
        SEGTrackPayload *eventPayload = arguments[0];
        BOOL enabled = [[self class] isTrackEvent:eventPayload.event enabledForIntegration:key inPlan:self.cachedSettings[@"plan"]];
        if (!enabled) {
            SEGLog(@"Not sending call to %@ because it is disabled in plan.", key);
            return;
        }
    }

    SEGLog(@"Running: %@ with arguments %@ on integration: %@", eventType, arguments, key);
    NSInvocation *invocation = [self invocationForSelector:selector arguments:arguments];
    [invocation invokeWithTarget:integration];
}

- (NSInvocation *)invocationForSelector:(SEL)selector arguments:(NSArray *)arguments
{
    struct objc_method_description description = protocol_getMethodDescription(@protocol(SEGIntegration), selector, NO, YES);

    NSMethodSignature *signature = [NSMethodSignature signatureWithObjCTypes:description.types];

    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    invocation.selector = selector;
    for (int i = 0; i < arguments.count; i++) {
        id argument = (arguments[i] == [NSNull null]) ? nil : arguments[i];
        [invocation setArgument:&argument atIndex:i + 2];
    }
    return invocation;
}

- (void)queueSelector:(SEL)selector arguments:(NSArray *)arguments options:(NSDictionary *)options
{
    NSArray *obj = @[ NSStringFromSelector(selector), arguments ?: @[], options ?: @{} ];
    SEGLog(@"Queueing: %@", obj);
    [_messageQueue addObject:obj];
}

- (void)flushMessageQueue
{
    if (_messageQueue.count != 0) {
        for (NSArray *arr in _messageQueue)
            [self forwardSelector:NSSelectorFromString(arr[0]) arguments:arr[1] options:arr[2]];
        [_messageQueue removeAllObjects];
    }
}

- (void)callIntegrationsWithSelector:(SEL)selector arguments:(NSArray *)arguments options:(NSDictionary *)options sync:(BOOL)sync
{
    // TODO: Currently we ignore the `sync` argument and queue the event asynchronously.
    // For integrations that need events to be on the main thread, they'll have to do so
    // manually and hop back on to the main thread.
    // Eventually we should figure out a way to handle this in analytics-ios itself.
    seg_dispatch_specific_async(_serialQueue, ^{
        if (self.initialized) {
            [self flushMessageQueue];
            [self forwardSelector:selector arguments:arguments options:options];
        } else {
            [self queueSelector:selector arguments:arguments options:options];
        }
    });
}

@end


@interface SEGPayload (Options)
@property (readonly) NSDictionary *options;
@end


@implementation SEGPayload (Options)

// Combine context and integrations to form options
- (NSDictionary *)options
{
    return @{
        @"context" : self.context ?: @{},
        @"integrations" : self.integrations ?: @{}
    };
}

@end


@implementation SEGIntegrationsManager (SEGMiddleware)

- (void)context:(SEGContext *)context next:(void (^_Nonnull)(SEGContext *_Nullable))next
{
    switch (context.eventType) {
        case SEGEventTypeIdentify: {
            SEGIdentifyPayload *p = (SEGIdentifyPayload *)context.payload;
            [self identify:p.userId traits:p.traits options:p.options];
            break;
        }
        case SEGEventTypeTrack: {
            SEGTrackPayload *p = (SEGTrackPayload *)context.payload;
            [self track:p.event properties:p.properties options:p.options];
            break;
        }
        case SEGEventTypeScreen: {
            SEGScreenPayload *p = (SEGScreenPayload *)context.payload;
            [self screen:p.name properties:p.properties options:p.options];
            break;
        }
        case SEGEventTypeGroup: {
            SEGGroupPayload *p = (SEGGroupPayload *)context.payload;
            [self group:p.groupId traits:p.traits options:p.options];
            break;
        }
        case SEGEventTypeAlias: {
            SEGAliasPayload *p = (SEGAliasPayload *)context.payload;
            [self alias:p.theNewId options:p.options];
            break;
        }
        case SEGEventTypeReset:
            [self reset];
            break;
        case SEGEventTypeFlush:
            [self flush];
            break;
        case SEGEventTypeReceivedRemoteNotification:
            [self receivedRemoteNotification:
                      [(SEGRemoteNotificationPayload *)context.payload userInfo]];
            break;
        case SEGEventTypeFailedToRegisterForRemoteNotifications:
            [self failedToRegisterForRemoteNotificationsWithError:
                      [(SEGRemoteNotificationPayload *)context.payload error]];
            break;
        case SEGEventTypeRegisteredForRemoteNotifications:
            [self registeredForRemoteNotificationsWithDeviceToken:
                      [(SEGRemoteNotificationPayload *)context.payload deviceToken]];
            break;
        case SEGEventTypeHandleActionWithForRemoteNotification: {
            SEGRemoteNotificationPayload *payload = (SEGRemoteNotificationPayload *)context.payload;
            [self handleActionWithIdentifier:payload.actionIdentifier
                       forRemoteNotification:payload.userInfo];
            break;
        }
        case SEGEventTypeApplicationLifecycle:
            [self handleAppStateNotification:
                      [(SEGApplicationLifecyclePayload *)context.payload notificationName]];
            break;
        case SEGEventTypeContinueUserActivity:
            [self continueUserActivity:
                      [(SEGContinueUserActivityPayload *)context.payload activity]];
            break;
        case SEGEventTypeOpenURL: {
            SEGOpenURLPayload *payload = (SEGOpenURLPayload *)context.payload;
            [self openURL:payload.url options:payload.options];
            break;
        }
        case SEGEventTypeUndefined:
            NSAssert(NO, @"Received context with undefined event type %@", context);
            NSLog(@"[ERROR]: Received context with undefined event type %@", context);
            break;
    }
    next(context);
}

@end
