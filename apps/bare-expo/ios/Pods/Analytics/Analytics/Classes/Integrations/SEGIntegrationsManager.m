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
NSString *const SEGAnonymousIdKey = @"SEGAnonymousId";
NSString *const kSEGAnonymousIdFilename = @"segment.anonymousId";
NSString *const kSEGCachedSettingsFilename = @"analytics.settings.v2.plist";


@interface SEGIdentifyPayload (AnonymousId)
@property (nonatomic, readwrite, nullable) NSString *anonymousId;
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
@property (nonatomic, strong) id<SEGStorage> userDefaultsStorage;
@property (nonatomic, strong) id<SEGStorage> fileStorage;

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
        
        self.userDefaultsStorage = [[SEGUserDefaultsStorage alloc] initWithDefaults:[NSUserDefaults standardUserDefaults] namespacePrefix:nil crypto:configuration.crypto];
        #if TARGET_OS_TV
            self.fileStorage = [[SEGFileStorage alloc] initWithFolder:[SEGFileStorage cachesDirectoryURL] crypto:configuration.crypto];
        #else
            self.fileStorage = [[SEGFileStorage alloc] initWithFolder:[SEGFileStorage applicationSupportDirectoryURL] crypto:configuration.crypto];
        #endif

        self.cachedAnonymousId = [self loadOrGenerateAnonymousID:NO];
        NSMutableArray *factories = [[configuration factories] mutableCopy];
        [factories addObject:[[SEGSegmentIntegrationFactory alloc] initWithHTTPClient:self.httpClient fileStorage:self.fileStorage userDefaultsStorage:self.userDefaultsStorage]];
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

- (void)identify:(SEGIdentifyPayload *)payload
{
    NSCAssert2(payload.userId.length > 0 || payload.traits.count > 0, @"either userId (%@) or traits (%@) must be provided.", payload.userId, payload.traits);

    NSString *anonymousId = payload.anonymousId;
    if (anonymousId) {
        [self saveAnonymousId:anonymousId];
    } else {
        anonymousId = self.cachedAnonymousId;
    }
    payload.anonymousId = anonymousId;

    [self callIntegrationsWithSelector:NSSelectorFromString(@"identify:")
                             arguments:@[ payload ]
                               options:payload.options
                                  sync:false];
}
/*
- (void)identify:(NSString *)userId traits:(NSDictionary *)traits options:(NSDictionary *)options
{
    NSCAssert2(userId.length > 0 || traits.count > 0, @"either userId (%@) or traits (%@) must be provided.", userId, traits);

    NSDictionary *options;
    if (p.anonymousId) {
        NSMutableDictionary *mutableOptions = [[NSMutableDictionary alloc] initWithDictionary:p.options];
        mutableOptions[@"anonymousId"] = p.anonymousId;
        options = [mutableOptions copy];
    } else {
        options =  p.options;
    }
    
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
}*/

#pragma mark - Track

- (void)track:(SEGTrackPayload *)payload
{
    NSCAssert1(payload.event.length > 0, @"event (%@) must not be empty.", payload.event);

    [self callIntegrationsWithSelector:NSSelectorFromString(@"track:")
                             arguments:@[ payload ]
                               options:payload.options
                                  sync:false];
}

#pragma mark - Screen

- (void)screen:(SEGScreenPayload *)payload
{
    NSCAssert1(payload.name.length > 0, @"screen name (%@) must not be empty.", payload.name);

    [self callIntegrationsWithSelector:NSSelectorFromString(@"screen:")
                             arguments:@[ payload ]
                               options:payload.options
                                  sync:false];
}

#pragma mark - Group

- (void)group:(SEGGroupPayload *)payload
{
    [self callIntegrationsWithSelector:NSSelectorFromString(@"group:")
                             arguments:@[ payload ]
                               options:payload.options
                                  sync:false];
}

#pragma mark - Alias

- (void)alias:(SEGAliasPayload *)payload
{
    [self callIntegrationsWithSelector:NSSelectorFromString(@"alias:")
                             arguments:@[ payload ]
                               options:payload.options
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
    NSString *anonymousId = [self.userDefaultsStorage stringForKey:SEGAnonymousIdKey];
#else
    NSString *anonymousId = [self.fileStorage stringForKey:kSEGAnonymousIdFilename];
#endif

    if (!anonymousId || reset) {
        // We've chosen to generate a UUID rather than use the UDID (deprecated in iOS 5),
        // identifierForVendor (iOS6 and later, can't be changed on logout),
        // or MAC address (blocked in iOS 7). For more info see https://segment.io/libraries/ios#ids
        anonymousId = GenerateUUIDString();
        SEGLog(@"New anonymousId: %@", anonymousId);
#if TARGET_OS_TV
        [self.userDefaultsStorage setString:anonymousId forKey:SEGAnonymousIdKey];
#else
        [self.fileStorage setString:anonymousId forKey:kSEGAnonymousIdFilename];
#endif
    }
    return anonymousId;
}

- (void)saveAnonymousId:(NSString *)anonymousId
{
    self.cachedAnonymousId = anonymousId;
#if TARGET_OS_TV
    [self.userDefaultsStorage setString:anonymousId forKey:SEGAnonymousIdKey];
#else
    [self.fileStorage setString:anonymousId forKey:kSEGAnonymousIdFilename];
#endif
}

- (void)flush
{
    [self callIntegrationsWithSelector:_cmd arguments:nil options:nil sync:false];
}

#pragma mark - Analytics Settings

- (NSDictionary *)cachedSettings
{
    if (!_cachedSettings) {
#if TARGET_OS_TV
        _cachedSettings = [self.userDefaultsStorage dictionaryForKey:kSEGCachedSettingsFilename] ?: @{};
#else
        _cachedSettings = [self.fileStorage dictionaryForKey:kSEGCachedSettingsFilename] ?: @{};
#endif
    }
    
    return _cachedSettings;
}

- (void)setCachedSettings:(NSDictionary *)settings
{
    _cachedSettings = [settings copy];
    if (!_cachedSettings) {
        // [@{} writeToURL:settingsURL atomically:YES];
        return;
    }
    
#if TARGET_OS_TV
    [self.userDefaultsStorage setDictionary:_cachedSettings forKey:kSEGCachedSettingsFilename];
#else
    [self.fileStorage setDictionary:_cachedSettings forKey:kSEGCachedSettingsFilename];
#endif

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
            seg_dispatch_specific_async(self -> _serialQueue, ^{
                if (success) {
                    [self setCachedSettings:settings];
                } else {
                    NSDictionary *previouslyCachedSettings = [self cachedSettings];
                    if (previouslyCachedSettings && [previouslyCachedSettings count] > 0) {
                        [self setCachedSettings:previouslyCachedSettings];
                    } else if (self.configuration.defaultSettings != nil) {
                        // If settings request fail, load a user-supplied version if present.
                        // but make sure segment.io is in the integrations
                        NSMutableDictionary *newSettings = [self.configuration.defaultSettings serializableMutableDeepCopy];
                        newSettings[@"integrations"][@"Segment.io"][@"apiKey"] = self.configuration.writeKey;
                        [self setCachedSettings:newSettings];
                    } else {
                        // If settings request fail, fall back to using just Segment integration.
                        // Doesn't address situations where this callback never gets called (though we don't expect that to ever happen).
                        [self setCachedSettings:@{
                            @"integrations" : @{
                                @"Segment.io" : @{@"apiKey" : self.configuration.writeKey},
                            },
                            @"plan" : @{@"track" : @{}}
                        }];
                    }
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
        id value = options[key];
        
        // it's been observed that customers sometimes override this with
        // value's that aren't bool types.
        if ([value isKindOfClass:[NSNumber class]]) {
            NSNumber *numberValue = (NSNumber *)value;
            return [numberValue boolValue];
        } if ([value isKindOfClass:[NSDictionary class]]) {
            return YES;
        } else {
            NSString *msg = [NSString stringWithFormat: @"Value for `%@` in integration options is supposed to be a boolean or dictionary and it is not!"
                             "This is likely due to a user-added value in `integrations` that overwrites a value received from the server", key];
            SEGLog(msg);
            NSAssert(NO, msg);
        }
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


@implementation SEGIntegrationsManager (SEGMiddleware)

- (void)context:(SEGContext *)context next:(void (^_Nonnull)(SEGContext *_Nullable))next
{
    switch (context.eventType) {
        case SEGEventTypeIdentify: {
            SEGIdentifyPayload *p = (SEGIdentifyPayload *)context.payload;
            [self identify:p];
            /*
            NSDictionary *options;
            if (p.anonymousId) {
                NSMutableDictionary *mutableOptions = [[NSMutableDictionary alloc] initWithDictionary:p.options];
                mutableOptions[@"anonymousId"] = p.anonymousId;
                options = [mutableOptions copy];
            } else {
                options =  p.options;
            }
            [self identify:p.userId traits:p.traits options:options];*/
            break;
        }
        case SEGEventTypeTrack: {
            SEGTrackPayload *p = (SEGTrackPayload *)context.payload;
            [self track:p];
            break;
        }
        case SEGEventTypeScreen: {
            SEGScreenPayload *p = (SEGScreenPayload *)context.payload;
            [self screen:p];
            break;
        }
        case SEGEventTypeGroup: {
            SEGGroupPayload *p = (SEGGroupPayload *)context.payload;
            [self group:p];
            break;
        }
        case SEGEventTypeAlias: {
            SEGAliasPayload *p = (SEGAliasPayload *)context.payload;
            [self alias:p];
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
