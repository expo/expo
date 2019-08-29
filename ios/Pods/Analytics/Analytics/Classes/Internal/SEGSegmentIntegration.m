#include <sys/sysctl.h>

#import <UIKit/UIKit.h>
#import "SEGAnalytics.h"
#import "SEGAnalyticsUtils.h"
#import "SEGSegmentIntegration.h"
#import "SEGReachability.h"
#import "SEGHTTPClient.h"
#import "SEGStorage.h"

#if TARGET_OS_IOS
#import <CoreTelephony/CTCarrier.h>
#import <CoreTelephony/CTTelephonyNetworkInfo.h>
#endif

NSString *const SEGSegmentDidSendRequestNotification = @"SegmentDidSendRequest";
NSString *const SEGSegmentRequestDidSucceedNotification = @"SegmentRequestDidSucceed";
NSString *const SEGSegmentRequestDidFailNotification = @"SegmentRequestDidFail";

NSString *const SEGAdvertisingClassIdentifier = @"ASIdentifierManager";
NSString *const SEGADClientClass = @"ADClient";

NSString *const SEGUserIdKey = @"SEGUserId";
NSString *const SEGQueueKey = @"SEGQueue";
NSString *const SEGTraitsKey = @"SEGTraits";

NSString *const kSEGUserIdFilename = @"segmentio.userId";
NSString *const kSEGQueueFilename = @"segmentio.queue.plist";
NSString *const kSEGTraitsFilename = @"segmentio.traits.plist";

static NSString *GetDeviceModel()
{
    size_t size;
    sysctlbyname("hw.machine", NULL, &size, NULL, 0);
    char result[size];
    sysctlbyname("hw.machine", result, &size, NULL, 0);
    NSString *results = [NSString stringWithCString:result encoding:NSUTF8StringEncoding];
    return results;
}

static BOOL GetAdTrackingEnabled()
{
    BOOL result = NO;
    Class advertisingManager = NSClassFromString(SEGAdvertisingClassIdentifier);
    SEL sharedManagerSelector = NSSelectorFromString(@"sharedManager");
    id sharedManager = ((id (*)(id, SEL))[advertisingManager methodForSelector:sharedManagerSelector])(advertisingManager, sharedManagerSelector);
    SEL adTrackingEnabledSEL = NSSelectorFromString(@"isAdvertisingTrackingEnabled");
    result = ((BOOL (*)(id, SEL))[sharedManager methodForSelector:adTrackingEnabledSEL])(sharedManager, adTrackingEnabledSEL);
    return result;
}


@interface SEGSegmentIntegration ()

@property (nonatomic, strong) NSMutableArray *queue;
@property (nonatomic, strong) NSDictionary *cachedStaticContext;
@property (nonatomic, strong) NSURLSessionUploadTask *batchRequest;
@property (nonatomic, assign) UIBackgroundTaskIdentifier flushTaskID;
@property (nonatomic, strong) SEGReachability *reachability;
@property (nonatomic, strong) NSTimer *flushTimer;
@property (nonatomic, strong) dispatch_queue_t serialQueue;
@property (nonatomic, strong) dispatch_queue_t backgroundTaskQueue;
@property (nonatomic, strong) NSMutableDictionary *traits;
@property (nonatomic, assign) SEGAnalytics *analytics;
@property (nonatomic, assign) SEGAnalyticsConfiguration *configuration;
@property (atomic, copy) NSDictionary *referrer;
@property (nonatomic, copy) NSString *userId;
@property (nonatomic, strong) NSURL *apiURL;
@property (nonatomic, strong) SEGHTTPClient *httpClient;
@property (nonatomic, strong) id<SEGStorage> storage;
@property (nonatomic, strong) NSURLSessionDataTask *attributionRequest;

@end


@implementation SEGSegmentIntegration

- (id)initWithAnalytics:(SEGAnalytics *)analytics httpClient:(SEGHTTPClient *)httpClient storage:(id<SEGStorage>)storage
{
    if (self = [super init]) {
        self.analytics = analytics;
        self.configuration = analytics.configuration;
        self.httpClient = httpClient;
        self.storage = storage;
        self.apiURL = [SEGMENT_API_BASE URLByAppendingPathComponent:@"import"];
        self.userId = [self getUserId];
        self.reachability = [SEGReachability reachabilityWithHostname:@"google.com"];
        [self.reachability startNotifier];
        self.cachedStaticContext = [self staticContext];
        self.serialQueue = seg_dispatch_queue_create_specific("io.segment.analytics.segmentio", DISPATCH_QUEUE_SERIAL);
        self.backgroundTaskQueue = seg_dispatch_queue_create_specific("io.segment.analytics.backgroundTask", DISPATCH_QUEUE_SERIAL);
        self.flushTaskID = UIBackgroundTaskInvalid;

#if !TARGET_OS_TV
        // Check for previous queue/track data in NSUserDefaults and remove if present
        [self dispatchBackground:^{
            if ([[NSUserDefaults standardUserDefaults] objectForKey:SEGQueueKey]) {
                [[NSUserDefaults standardUserDefaults] removeObjectForKey:SEGQueueKey];
            }
            if ([[NSUserDefaults standardUserDefaults] objectForKey:SEGTraitsKey]) {
                [[NSUserDefaults standardUserDefaults] removeObjectForKey:SEGTraitsKey];
            }
        }];
#endif
        [self dispatchBackground:^{
            [self trackAttributionData:self.configuration.trackAttributionData];
        }];

        if ([NSThread isMainThread]) {
            [self setupFlushTimer];
        } else {
            dispatch_sync(dispatch_get_main_queue(), ^{
                [self setupFlushTimer];
            });
        }
    }
    return self;
}

- (void)setupFlushTimer
{
    self.flushTimer = [NSTimer scheduledTimerWithTimeInterval:self.configuration.flushInterval
                                                       target:self
                                                     selector:@selector(flush)
                                                     userInfo:nil
                                                      repeats:YES];
}

/*
 * There is an iOS bug that causes instances of the CTTelephonyNetworkInfo class to
 * sometimes get notifications after they have been deallocated.
 * Instead of instantiating, using, and releasing instances you * must instead retain
 * and never release them to work around the bug.
 *
 * Ref: http://stackoverflow.com/questions/14238586/coretelephony-crash
 */

#if TARGET_OS_IOS
static CTTelephonyNetworkInfo *_telephonyNetworkInfo;
#endif

- (NSDictionary *)staticContext
{
    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];

    dict[@"library"] = @{
        @"name" : @"analytics-ios",
        @"version" : [SEGAnalytics version]
    };

    NSMutableDictionary *infoDictionary = [[[NSBundle mainBundle] infoDictionary] mutableCopy];
    [infoDictionary addEntriesFromDictionary:[[NSBundle mainBundle] localizedInfoDictionary]];
    if (infoDictionary.count) {
        dict[@"app"] = @{
            @"name" : infoDictionary[@"CFBundleDisplayName"] ?: @"",
            @"version" : infoDictionary[@"CFBundleShortVersionString"] ?: @"",
            @"build" : infoDictionary[@"CFBundleVersion"] ?: @"",
            @"namespace" : [[NSBundle mainBundle] bundleIdentifier] ?: @"",
        };
    }

    UIDevice *device = [UIDevice currentDevice];

    dict[@"device"] = ({
        NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
        dict[@"manufacturer"] = @"Apple";
        dict[@"type"] = @"ios";
        dict[@"model"] = GetDeviceModel();
        dict[@"id"] = [[device identifierForVendor] UUIDString];
        if (NSClassFromString(SEGAdvertisingClassIdentifier)) {
            dict[@"adTrackingEnabled"] = @(GetAdTrackingEnabled());
        }
        if (self.configuration.enableAdvertisingTracking) {
            NSString *idfa = SEGIDFA();
            if (idfa.length) dict[@"advertisingId"] = idfa;
        }
        dict;
    });

    dict[@"os"] = @{
        @"name" : device.systemName,
        @"version" : device.systemVersion
    };

    CGSize screenSize = [UIScreen mainScreen].bounds.size;
    dict[@"screen"] = @{
        @"width" : @(screenSize.width),
        @"height" : @(screenSize.height)
    };

#if !(TARGET_IPHONE_SIMULATOR)
    Class adClient = NSClassFromString(SEGADClientClass);
    if (adClient) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
        id sharedClient = [adClient performSelector:NSSelectorFromString(@"sharedClient")];
#pragma clang diagnostic pop
        void (^completionHandler)(BOOL iad) = ^(BOOL iad) {
            if (iad) {
                dict[@"referrer"] = @{ @"type" : @"iad" };
            }
        };
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
        [sharedClient performSelector:NSSelectorFromString(@"determineAppInstallationAttributionWithCompletionHandler:")
                           withObject:completionHandler];
#pragma clang diagnostic pop
    }
#endif

    return dict;
}

- (NSDictionary *)liveContext
{
    NSMutableDictionary *context = [[NSMutableDictionary alloc] init];
    context[@"locale"] = [NSString stringWithFormat:
                                       @"%@-%@",
                                       [NSLocale.currentLocale objectForKey:NSLocaleLanguageCode],
                                       [NSLocale.currentLocale objectForKey:NSLocaleCountryCode]];

    context[@"timezone"] = [[NSTimeZone localTimeZone] name];

    context[@"network"] = ({
        NSMutableDictionary *network = [[NSMutableDictionary alloc] init];

        if (self.reachability.isReachable) {
            network[@"wifi"] = @(self.reachability.isReachableViaWiFi);
            network[@"cellular"] = @(self.reachability.isReachableViaWWAN);
        }

#if TARGET_OS_IOS
        static dispatch_once_t networkInfoOnceToken;
        dispatch_once(&networkInfoOnceToken, ^{
            _telephonyNetworkInfo = [[CTTelephonyNetworkInfo alloc] init];
        });

        CTCarrier *carrier = [_telephonyNetworkInfo subscriberCellularProvider];
        if (carrier.carrierName.length)
            network[@"carrier"] = carrier.carrierName;
#endif

        network;
    });

    context[@"traits"] = ({
        NSMutableDictionary *traits = [[NSMutableDictionary alloc] initWithDictionary:[self traits]];
        traits;
    });

    if (self.referrer) {
        context[@"referrer"] = [self.referrer copy];
    }

    return [context copy];
}

- (void)dispatchBackground:(void (^)(void))block
{
    seg_dispatch_specific_async(_serialQueue, block);
}

- (void)dispatchBackgroundAndWait:(void (^)(void))block
{
    seg_dispatch_specific_sync(_serialQueue, block);
}

- (void)beginBackgroundTask
{
    [self endBackgroundTask];

    seg_dispatch_specific_sync(_backgroundTaskQueue, ^{
        id<SEGApplicationProtocol> application = [self.analytics configuration].application;
        if (application) {
            self.flushTaskID = [application seg_beginBackgroundTaskWithName:@"Segmentio.Flush"
                                                          expirationHandler:^{
                                                              [self endBackgroundTask];
                                                          }];
        }
    });
}

- (void)endBackgroundTask
{
    // endBackgroundTask and beginBackgroundTask can be called from main thread
    // We should not dispatch to the same queue we use to flush events because it can cause deadlock
    // inside @synchronized(self) block for SEGIntegrationsManager as both events queue and main queue
    // attempt to call forwardSelector:arguments:options:
    // See https://github.com/segmentio/analytics-ios/issues/683
    seg_dispatch_specific_sync(_backgroundTaskQueue, ^{
        if (self.flushTaskID != UIBackgroundTaskInvalid) {
            id<SEGApplicationProtocol> application = [self.analytics configuration].application;
            if (application) {
                [application seg_endBackgroundTask:self.flushTaskID];
            }

            self.flushTaskID = UIBackgroundTaskInvalid;
        }
    });
}

- (NSString *)description
{
    return [NSString stringWithFormat:@"<%p:%@, %@>", self, self.class, self.configuration.writeKey];
}

- (void)saveUserId:(NSString *)userId
{
    [self dispatchBackground:^{
        self.userId = userId;

#if TARGET_OS_TV
        [self.storage setString:userId forKey:SEGUserIdKey];
#else
        [self.storage setString:userId forKey:kSEGUserIdFilename];
#endif
    }];
}

- (void)addTraits:(NSDictionary *)traits
{
    [self dispatchBackground:^{
        [self.traits addEntriesFromDictionary:traits];

#if TARGET_OS_TV
        [self.storage setDictionary:[self.traits copy] forKey:SEGTraitsKey];
#else
        [self.storage setDictionary:[self.traits copy] forKey:kSEGTraitsFilename];
#endif
    }];
}

#pragma mark - Analytics API

- (void)identify:(SEGIdentifyPayload *)payload
{
    [self dispatchBackground:^{
        [self saveUserId:payload.userId];
        [self addTraits:payload.traits];
    }];

    NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
    [dictionary setValue:payload.traits forKey:@"traits"];

    [self enqueueAction:@"identify" dictionary:dictionary context:payload.context integrations:payload.integrations];
}

- (void)track:(SEGTrackPayload *)payload
{
    NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
    [dictionary setValue:payload.event forKey:@"event"];
    [dictionary setValue:payload.properties forKey:@"properties"];
    [self enqueueAction:@"track" dictionary:dictionary context:payload.context integrations:payload.integrations];
}

- (void)screen:(SEGScreenPayload *)payload
{
    NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
    [dictionary setValue:payload.name forKey:@"name"];
    [dictionary setValue:payload.properties forKey:@"properties"];

    [self enqueueAction:@"screen" dictionary:dictionary context:payload.context integrations:payload.integrations];
}

- (void)group:(SEGGroupPayload *)payload
{
    NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
    [dictionary setValue:payload.groupId forKey:@"groupId"];
    [dictionary setValue:payload.traits forKey:@"traits"];

    [self enqueueAction:@"group" dictionary:dictionary context:payload.context integrations:payload.integrations];
}

- (void)alias:(SEGAliasPayload *)payload
{
    NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
    [dictionary setValue:payload.theNewId forKey:@"userId"];
    [dictionary setValue:self.userId ?: [self.analytics getAnonymousId] forKey:@"previousId"];

    [self enqueueAction:@"alias" dictionary:dictionary context:payload.context integrations:payload.integrations];
}

- (void)registeredForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
    NSCParameterAssert(deviceToken != nil);

    const unsigned char *buffer = (const unsigned char *)[deviceToken bytes];
    if (!buffer) {
        return;
    }
    NSMutableString *token = [NSMutableString stringWithCapacity:(deviceToken.length * 2)];
    for (NSUInteger i = 0; i < deviceToken.length; i++) {
        [token appendString:[NSString stringWithFormat:@"%02lx", (unsigned long)buffer[i]]];
    }
    [self.cachedStaticContext[@"device"] setObject:[token copy] forKey:@"token"];
}

- (void)continueUserActivity:(NSUserActivity *)activity
{
    if ([activity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
        self.referrer = @{
            @"url" : activity.webpageURL.absoluteString,
        };
    }
}

- (void)openURL:(NSURL *)url options:(NSDictionary *)options
{
    self.referrer = @{
        @"url" : url.absoluteString,
    };
}

#pragma mark - Queueing

// Merges user provided integration options with bundled integrations.
- (NSDictionary *)integrationsDictionary:(NSDictionary *)integrations
{
    NSMutableDictionary *dict = [integrations ?: @{} mutableCopy];
    for (NSString *integration in self.analytics.bundledIntegrations) {
        // Don't record Segment.io in the dictionary. It is always enabled.
        if ([integration isEqualToString:@"Segment.io"]) {
            continue;
        }
        dict[integration] = @NO;
    }
    return [dict copy];
}

- (void)enqueueAction:(NSString *)action dictionary:(NSMutableDictionary *)payload context:(NSDictionary *)context integrations:(NSDictionary *)integrations
{
    // attach these parts of the payload outside since they are all synchronous
    // and the timestamp will be more accurate.
    payload[@"type"] = action;
    payload[@"timestamp"] = iso8601FormattedString([NSDate date]);
    payload[@"messageId"] = GenerateUUIDString();

    [self dispatchBackground:^{
        // attach userId and anonymousId inside the dispatch_async in case
        // they've changed (see identify function)

        // Do not override the userId for an 'alias' action. This value is set in [alias:] already.
        if (![action isEqualToString:@"alias"]) {
            [payload setValue:self.userId forKey:@"userId"];
        }
        [payload setValue:[self.analytics getAnonymousId] forKey:@"anonymousId"];

        [payload setValue:[self integrationsDictionary:integrations] forKey:@"integrations"];

        NSDictionary *staticContext = self.cachedStaticContext;
        NSDictionary *liveContext = [self liveContext];
        NSDictionary *customContext = context;
        NSMutableDictionary *context = [NSMutableDictionary dictionaryWithCapacity:staticContext.count + liveContext.count + customContext.count];
        [context addEntriesFromDictionary:staticContext];
        [context addEntriesFromDictionary:liveContext];
        [context addEntriesFromDictionary:customContext];
        [payload setValue:[context copy] forKey:@"context"];

        SEGLog(@"%@ Enqueueing action: %@", self, payload);
        [self queuePayload:[payload copy]];
    }];
}

- (void)queuePayload:(NSDictionary *)payload
{
    @try {
        // Trim the queue to maxQueueSize - 1 before we add a new element.
        trimQueue(self.queue, self.analytics.configuration.maxQueueSize - 1);
        [self.queue addObject:payload];
        [self persistQueue];
        [self flushQueueByLength];
    }
    @catch (NSException *exception) {
        SEGLog(@"%@ Error writing payload: %@", self, exception);
    }
}

- (void)flush
{
    [self flushWithMaxSize:self.maxBatchSize];
}

- (void)flushWithMaxSize:(NSUInteger)maxBatchSize
{
    [self dispatchBackground:^{
        if ([self.queue count] == 0) {
            SEGLog(@"%@ No queued API calls to flush.", self);
            [self endBackgroundTask];
            return;
        }
        if (self.batchRequest != nil) {
            SEGLog(@"%@ API request already in progress, not flushing again.", self);
            return;
        }

        NSArray *batch;
        if ([self.queue count] >= maxBatchSize) {
            batch = [self.queue subarrayWithRange:NSMakeRange(0, maxBatchSize)];
        } else {
            batch = [NSArray arrayWithArray:self.queue];
        }

        [self sendData:batch];
    }];
}

- (void)flushQueueByLength
{
    [self dispatchBackground:^{
        SEGLog(@"%@ Length is %lu.", self, (unsigned long)self.queue.count);

        if (self.batchRequest == nil && [self.queue count] >= self.configuration.flushAt) {
            [self flush];
        }
    }];
}

- (void)reset
{
    [self dispatchBackgroundAndWait:^{
#if TARGET_OS_TV
        [self.storage removeKey:SEGUserIdKey];
        [self.storage removeKey:SEGTraitsKey];
#else
        [self.storage removeKey:kSEGUserIdFilename];
        [self.storage removeKey:kSEGTraitsFilename];
#endif

        self.userId = nil;
        self.traits = [NSMutableDictionary dictionary];
    }];
}

- (void)notifyForName:(NSString *)name userInfo:(id)userInfo
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [[NSNotificationCenter defaultCenter] postNotificationName:name object:userInfo];
        SEGLog(@"sent notification %@", name);
    });
}

- (void)sendData:(NSArray *)batch
{
    NSMutableDictionary *payload = [[NSMutableDictionary alloc] init];
    [payload setObject:iso8601FormattedString([NSDate date]) forKey:@"sentAt"];
    [payload setObject:batch forKey:@"batch"];

    SEGLog(@"%@ Flushing %lu of %lu queued API calls.", self, (unsigned long)batch.count, (unsigned long)self.queue.count);
    SEGLog(@"Flushing batch %@.", payload);

    self.batchRequest = [self.httpClient upload:payload forWriteKey:self.configuration.writeKey completionHandler:^(BOOL retry) {
        [self dispatchBackground:^{
            if (retry) {
                [self notifyForName:SEGSegmentRequestDidFailNotification userInfo:batch];
                self.batchRequest = nil;
                [self endBackgroundTask];
                return;
            }

            [self.queue removeObjectsInArray:batch];
            [self persistQueue];
            [self notifyForName:SEGSegmentRequestDidSucceedNotification userInfo:batch];
            self.batchRequest = nil;
            [self endBackgroundTask];
        }];
    }];

    [self notifyForName:SEGSegmentDidSendRequestNotification userInfo:batch];
}

- (void)applicationDidEnterBackground
{
    [self beginBackgroundTask];
    // We are gonna try to flush as much as we reasonably can when we enter background
    // since there is a chance that the user will never launch the app again.
    [self flush];
}

- (void)applicationWillTerminate
{
    [self dispatchBackgroundAndWait:^{
        if (self.queue.count)
            [self persistQueue];
    }];
}

#pragma mark - Private

- (NSMutableArray *)queue
{
    if (!_queue) {
#if TARGET_OS_TV
        _queue = [[self.storage arrayForKey:SEGQueueKey] ?: @[] mutableCopy];
#else
        _queue = [[self.storage arrayForKey:kSEGQueueFilename] ?: @[] mutableCopy];
#endif
    }

    return _queue;
}

- (NSMutableDictionary *)traits
{
    if (!_traits) {
#if TARGET_OS_TV
        _traits = [[self.storage dictionaryForKey:SEGTraitsKey] ?: @{} mutableCopy];
#else
        _traits = [[self.storage dictionaryForKey:kSEGTraitsFilename] ?: @{} mutableCopy];
#endif
    }

    return _traits;
}

- (NSUInteger)maxBatchSize
{
    return 100;
}

- (NSString *)getUserId
{
    return [[NSUserDefaults standardUserDefaults] valueForKey:SEGUserIdKey] ?: [self.storage stringForKey:kSEGUserIdFilename];
}

- (void)persistQueue
{
#if TARGET_OS_TV
    [self.storage setArray:[self.queue copy] forKey:SEGQueueKey];
#else
    [self.storage setArray:[self.queue copy] forKey:kSEGQueueFilename];
#endif
}

NSString *const SEGTrackedAttributionKey = @"SEGTrackedAttributionKey";

- (void)trackAttributionData:(BOOL)trackAttributionData
{
#if TARGET_OS_IPHONE
    if (!trackAttributionData) {
        return;
    }

    BOOL trackedAttribution = [[NSUserDefaults standardUserDefaults] boolForKey:SEGTrackedAttributionKey];
    if (trackedAttribution) {
        return;
    }

    NSDictionary *staticContext = self.cachedStaticContext;
    NSDictionary *liveContext = [self liveContext];
    NSMutableDictionary *context = [NSMutableDictionary dictionaryWithCapacity:staticContext.count + liveContext.count];
    [context addEntriesFromDictionary:staticContext];
    [context addEntriesFromDictionary:liveContext];

    self.attributionRequest = [self.httpClient attributionWithWriteKey:self.configuration.writeKey forDevice:[context copy] completionHandler:^(BOOL success, NSDictionary *properties) {
        [self dispatchBackground:^{
            if (success) {
                [self.analytics track:@"Install Attributed" properties:properties];
                [[NSUserDefaults standardUserDefaults] setBool:YES forKey:SEGTrackedAttributionKey];
            }
            self.attributionRequest = nil;
        }];
    }];
#endif
}

@end
