//
// Amplitude.m

#ifndef AMPLITUDE_DEBUG
#define AMPLITUDE_DEBUG 0
#endif

#ifndef AMPLITUDE_LOG
#if AMPLITUDE_DEBUG
#   define AMPLITUDE_LOG(fmt, ...) NSLog(fmt, ##__VA_ARGS__)
#else
#   define AMPLITUDE_LOG(...)
#endif
#endif

#ifndef AMPLITUDE_LOG_ERRORS
#define AMPLITUDE_LOG_ERRORS 1
#endif

#ifndef AMPLITUDE_ERROR
#if AMPLITUDE_LOG_ERRORS
#   define AMPLITUDE_ERROR(fmt, ...) NSLog(fmt, ##__VA_ARGS__)
#else
#   define AMPLITUDE_ERROR(...)
#endif
#endif


#import "Amplitude.h"
#import "AMPLocationManagerDelegate.h"
#import "AMPARCMacros.h"
#import "AMPConstants.h"
#import "AMPDeviceInfo.h"
#import "AMPURLConnection.h"
#import "AMPURLSession.h"
#import "AMPDatabaseHelper.h"
#import "AMPUtils.h"
#import "AMPIdentify.h"
#import "AMPRevenue.h"
#import "AMPTrackingOptions.h"
#import <math.h>
#import <sys/socket.h>
#import <sys/sysctl.h>
#import <net/if.h>
#import <net/if_dl.h>
#import <CommonCrypto/CommonDigest.h>
#import <UIKit/UIKit.h>
#include <sys/types.h>
#include <sys/sysctl.h>

@interface Amplitude ()

@property (nonatomic, strong) NSOperationQueue *backgroundQueue;
@property (nonatomic, strong) NSOperationQueue *initializerQueue;
@property (nonatomic, strong) AMPDatabaseHelper *dbHelper;
@property (nonatomic, assign) BOOL initialized;
@property (nonatomic, assign) BOOL sslPinningEnabled;
@property (nonatomic, assign) long long sessionId;
@property (nonatomic, assign) BOOL backoffUpload;
@property (nonatomic, assign) int backoffUploadBatchSize;

@end

NSString *const kAMPSessionStartEvent = @"session_start";
NSString *const kAMPSessionEndEvent = @"session_end";
NSString *const kAMPRevenueEvent = @"revenue_amount";

static NSString *const BACKGROUND_QUEUE_NAME = @"BACKGROUND";
static NSString *const DATABASE_VERSION = @"database_version";
static NSString *const DEVICE_ID = @"device_id";
static NSString *const EVENTS = @"events";
static NSString *const EVENT_ID = @"event_id";
static NSString *const PREVIOUS_SESSION_ID = @"previous_session_id";
static NSString *const PREVIOUS_SESSION_TIME = @"previous_session_time";
static NSString *const MAX_EVENT_ID = @"max_event_id";
static NSString *const MAX_IDENTIFY_ID = @"max_identify_id";
static NSString *const OPT_OUT = @"opt_out";
static NSString *const USER_ID = @"user_id";
static NSString *const SEQUENCE_NUMBER = @"sequence_number";


@implementation Amplitude {
    NSString *_eventsDataPath;
    NSMutableDictionary *_propertyList;

    BOOL _updateScheduled;
    BOOL _updatingCurrently;
    UIBackgroundTaskIdentifier _uploadTaskID;

    AMPDeviceInfo *_deviceInfo;
    BOOL _useAdvertisingIdForDeviceId;
    BOOL _disableIdfaTracking;
    long long _lastEventTime;

    CLLocation *_lastKnownLocation;
    BOOL _locationListeningEnabled;
    CLLocationManager *_locationManager;
    AMPLocationManagerDelegate *_locationManagerDelegate;

    AMPTrackingOptions *_trackingOptions;
    NSDictionary *_apiPropertiesTrackingOptions;

    BOOL _inForeground;
    BOOL _offline;

    NSString* _serverUrl;
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
#pragma mark - Static methods

+ (Amplitude *)instance {
    return [Amplitude instanceWithName:nil];
}

+ (Amplitude *)instanceWithName:(NSString*)instanceName {
    static NSMutableDictionary *_instances = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _instances = [[NSMutableDictionary alloc] init];
    });

    // compiler wants explicit key nil check even though AMPUtils isEmptyString already has one
    if (instanceName == nil || [AMPUtils isEmptyString:instanceName]) {
        instanceName = kAMPDefaultInstance;
    }
    instanceName = [instanceName lowercaseString];

    Amplitude *client = nil;
    @synchronized(_instances) {
        client = [_instances objectForKey:instanceName];
        if (client == nil) {
            client = [[self alloc] initWithInstanceName:instanceName];
            [_instances setObject:client forKey:instanceName];
            SAFE_ARC_RELEASE(client);
        }
    }

    return client;
}

+ (void)initializeApiKey:(NSString*) apiKey {
    [[Amplitude instance] initializeApiKey:apiKey];
}

+ (void)initializeApiKey:(NSString*) apiKey userId:(NSString*) userId {
    [[Amplitude instance] initializeApiKey:apiKey userId:userId];
}

+ (void)logEvent:(NSString*) eventType {
    [[Amplitude instance] logEvent:eventType];
}

+ (void)logEvent:(NSString*) eventType withEventProperties:(NSDictionary*) eventProperties {
    [[Amplitude instance] logEvent:eventType withEventProperties:eventProperties];
}

+ (void)logRevenue:(NSNumber*) amount {
    [[Amplitude instance] logRevenue:amount];
}

+ (void)logRevenue:(NSString*) productIdentifier quantity:(NSInteger) quantity price:(NSNumber*) price {
    [[Amplitude instance] logRevenue:productIdentifier quantity:quantity price:price];
}

+ (void)logRevenue:(NSString*) productIdentifier quantity:(NSInteger) quantity price:(NSNumber*) price receipt:(NSData*) receipt {
    [[Amplitude instance] logRevenue:productIdentifier quantity:quantity price:price receipt:receipt];
}

+ (void)uploadEvents {
    [[Amplitude instance] uploadEvents];
}

+ (void)setUserProperties:(NSDictionary*) userProperties {
    [[Amplitude instance] setUserProperties:userProperties];
}

+ (void)setUserId:(NSString*) userId {
    [[Amplitude instance] setUserId:userId];
}

+ (void)enableLocationListening {
    [[Amplitude instance] enableLocationListening];
}

+ (void)disableLocationListening {
    [[Amplitude instance] disableLocationListening];
}

+ (void)useAdvertisingIdForDeviceId {
    [[Amplitude instance] useAdvertisingIdForDeviceId];
}

+ (void)printEventsCount {
    [[Amplitude instance] printEventsCount];
}

+ (NSString*)getDeviceId {
    return [[Amplitude instance] getDeviceId];
}

+ (void)updateLocation
{
    [[Amplitude instance] updateLocation];
}

#pragma mark - Main class methods
- (id)init
{
    return [self initWithInstanceName:nil];
}

- (id)initWithInstanceName:(NSString*) instanceName
{
    if ([AMPUtils isEmptyString:instanceName]) {
        instanceName = kAMPDefaultInstance;
    }
    instanceName = [instanceName lowercaseString];

    if ((self = [super init])) {

#if AMPLITUDE_SSL_PINNING
        _sslPinningEnabled = YES;
#else
        _sslPinningEnabled = NO;
#endif

        _initialized = NO;
        _locationListeningEnabled = YES;
        _sessionId = -1;
        _updateScheduled = NO;
        _updatingCurrently = NO;
        _useAdvertisingIdForDeviceId = NO;
        _disableIdfaTracking = NO;
        _backoffUpload = NO;
        _offline = NO;
        _serverUrl = SAFE_ARC_RETAIN(kAMPEventLogUrl);
        _trackingOptions = SAFE_ARC_RETAIN([AMPTrackingOptions options]);
        _apiPropertiesTrackingOptions = SAFE_ARC_RETAIN([NSDictionary dictionary]);
        _instanceName = SAFE_ARC_RETAIN(instanceName);
        _dbHelper = SAFE_ARC_RETAIN([AMPDatabaseHelper getDatabaseHelper:instanceName]);

        self.eventUploadThreshold = kAMPEventUploadThreshold;
        self.eventMaxCount = kAMPEventMaxCount;
        self.eventUploadMaxBatchSize = kAMPEventUploadMaxBatchSize;
        self.eventUploadPeriodSeconds = kAMPEventUploadPeriodSeconds;
        self.minTimeBetweenSessionsMillis = kAMPMinTimeBetweenSessionsMillis;
        _backoffUploadBatchSize = self.eventUploadMaxBatchSize;

        _initializerQueue = [[NSOperationQueue alloc] init];
        _backgroundQueue = [[NSOperationQueue alloc] init];
        // Force method calls to happen in FIFO order by only allowing 1 concurrent operation
        [_backgroundQueue setMaxConcurrentOperationCount:1];
        // Ensure initialize finishes running asynchronously before other calls are run
        [_backgroundQueue setSuspended:YES];
        // Name the queue so runOnBackgroundQueue can tell which queue an operation is running
        _backgroundQueue.name = BACKGROUND_QUEUE_NAME;
        
        [_initializerQueue addOperationWithBlock:^{

            self->_uploadTaskID = UIBackgroundTaskInvalid;
            
            NSString *eventsDataDirectory = [AMPUtils platformDataDirectory];
            NSString *propertyListPath = [eventsDataDirectory stringByAppendingPathComponent:@"com.amplitude.plist"];
            if (![self->_instanceName isEqualToString:kAMPDefaultInstance]) {
                propertyListPath = [NSString stringWithFormat:@"%@_%@", propertyListPath, self->_instanceName]; // namespace pList with instance name
            }
            self->_propertyListPath = SAFE_ARC_RETAIN(propertyListPath);
            self->_eventsDataPath = SAFE_ARC_RETAIN([eventsDataDirectory stringByAppendingPathComponent:@"com.amplitude.archiveDict"]);
            [self upgradePrefs];

            // Load propertyList object
            self->_propertyList = SAFE_ARC_RETAIN([self deserializePList:self->_propertyListPath]);
            if (!self->_propertyList) {
                self->_propertyList = SAFE_ARC_RETAIN([NSMutableDictionary dictionary]);
                [self->_propertyList setObject:[NSNumber numberWithInt:1] forKey:DATABASE_VERSION];
                BOOL success = [self savePropertyList];
                if (!success) {
                    AMPLITUDE_ERROR(@"ERROR: Unable to save propertyList to file on initialization");
                }
            } else {
                AMPLITUDE_LOG(@"Loaded from %@", _propertyListPath);
            }

            // update database if necessary
            int oldDBVersion = 1;
            NSNumber *oldDBVersionSaved = [self->_propertyList objectForKey:DATABASE_VERSION];
            if (oldDBVersionSaved != nil) {
                oldDBVersion = [oldDBVersionSaved intValue];
            }

            // update the database
            if (oldDBVersion < kAMPDBVersion) {
                if ([self.dbHelper upgrade:oldDBVersion newVersion:kAMPDBVersion]) {
                    [self->_propertyList setObject:[NSNumber numberWithInt:kAMPDBVersion] forKey:DATABASE_VERSION];
                    [self savePropertyList];
                }
            }

            // only on default instance, migrate all of old _eventsData object to database store if database just created
            if ([self->_instanceName isEqualToString:kAMPDefaultInstance] && oldDBVersion < kAMPDBFirstVersion) {
                if ([self migrateEventsDataToDB]) {
                    // delete events data so don't need to migrate next time
                    if ([[NSFileManager defaultManager] fileExistsAtPath:self->_eventsDataPath]) {
                        [[NSFileManager defaultManager] removeItemAtPath:self->_eventsDataPath error:NULL];
                    }
                }
            }
            SAFE_ARC_RELEASE(self->_eventsDataPath);

            // try to restore previous session
            long long previousSessionId = [self previousSessionId];
            if (previousSessionId >= 0) {
                self->_sessionId = previousSessionId;
            }
            self->_lastEventTime = [self getLastEventTime];
            self->_optOut = [self loadOptOut];

            [self->_backgroundQueue setSuspended:NO];
        }];

        // CLLocationManager must be created on the main thread
        dispatch_async(dispatch_get_main_queue(), ^{
            Class CLLocationManager = NSClassFromString(@"CLLocationManager");
            self->_locationManager = [[CLLocationManager alloc] init];
            self->_locationManagerDelegate = [[AMPLocationManagerDelegate alloc] init];
            SEL setDelegate = NSSelectorFromString(@"setDelegate:");
            [self->_locationManager performSelector:setDelegate withObject:self->_locationManagerDelegate];
        });

        [self addObservers];
    }
    return self;
}

// maintain backwards compatibility on default instance
- (BOOL) migrateEventsDataToDB
{
    NSDictionary *eventsData = [self unarchive:_eventsDataPath];
    if (eventsData == nil) {
        return NO;
    }

    AMPDatabaseHelper *defaultDbHelper = [AMPDatabaseHelper getDatabaseHelper];
    BOOL success = YES;

    // migrate events
    NSArray *events = [eventsData objectForKey:EVENTS];
    for (id event in events) {
        NSError *error = nil;
        NSData *jsonData = nil;
        jsonData = [NSJSONSerialization dataWithJSONObject:[AMPUtils makeJSONSerializable:event] options:0 error:&error];
        if (error != nil) {
            AMPLITUDE_ERROR(@"ERROR: NSJSONSerialization error: %@", error);
            continue;
        }
        NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        if ([AMPUtils isEmptyString:jsonString]) {
            AMPLITUDE_ERROR(@"ERROR: NSJSONSerialization resulted in a null string, skipping this event");
            if (jsonString != nil) {
                SAFE_ARC_RELEASE(jsonString);
            }
            continue;
        }
        success &= [defaultDbHelper addEvent:jsonString];
        SAFE_ARC_RELEASE(jsonString);
    }

    // migrate remaining properties
    NSString *userId = [eventsData objectForKey:USER_ID];
    if (userId != nil) {
        success &= [defaultDbHelper insertOrReplaceKeyValue:USER_ID value:userId];
    }
    NSNumber *optOut = [eventsData objectForKey:OPT_OUT];
    if (optOut != nil) {
        success &= [defaultDbHelper insertOrReplaceKeyLongValue:OPT_OUT value:optOut];
    }
    NSString *deviceId = [eventsData objectForKey:DEVICE_ID];
    if (deviceId != nil) {
        success &= [defaultDbHelper insertOrReplaceKeyValue:DEVICE_ID value:deviceId];
    }
    NSNumber *previousSessionId = [eventsData objectForKey:PREVIOUS_SESSION_ID];
    if (previousSessionId != nil) {
        success &= [defaultDbHelper insertOrReplaceKeyLongValue:PREVIOUS_SESSION_ID value:previousSessionId];
    }
    NSNumber *previousSessionTime = [eventsData objectForKey:PREVIOUS_SESSION_TIME];
    if (previousSessionTime != nil) {
        success &= [defaultDbHelper insertOrReplaceKeyLongValue:PREVIOUS_SESSION_TIME value:previousSessionTime];
    }

    return success;
}

- (void) addObservers
{
    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self
               selector:@selector(enterForeground)
                   name:UIApplicationWillEnterForegroundNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(enterBackground)
                   name:UIApplicationDidEnterBackgroundNotification
                 object:nil];
}

- (void) removeObservers
{
    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center removeObserver:self name:UIApplicationWillEnterForegroundNotification object:nil];
    [center removeObserver:self name:UIApplicationDidEnterBackgroundNotification object:nil];
}

- (void) dealloc {
    [self removeObservers];

    // Release properties
    SAFE_ARC_RELEASE(_apiKey);
    SAFE_ARC_RELEASE(_backgroundQueue);
    SAFE_ARC_RELEASE(_deviceId);
    SAFE_ARC_RELEASE(_userId);

    // Release instance variables
    SAFE_ARC_RELEASE(_deviceInfo);
    SAFE_ARC_RELEASE(_initializerQueue);
    SAFE_ARC_RELEASE(_lastKnownLocation);
    SAFE_ARC_RELEASE(_locationManager);
    SAFE_ARC_RELEASE(_locationManagerDelegate);
    SAFE_ARC_RELEASE(_propertyList);
    SAFE_ARC_RELEASE(_propertyListPath);
    SAFE_ARC_RELEASE(_dbHelper);
    SAFE_ARC_RELEASE(_instanceName);
    SAFE_ARC_RELEASE(_trackingOptions);
    SAFE_ARC_RELEASE(_apiPropertiesTrackingOptions);
    SAFE_ARC_RELEASE(_serverUrl);

    SAFE_ARC_SUPER_DEALLOC();
}

- (void)initializeApiKey:(NSString*) apiKey
{
    [self initializeApiKey:apiKey userId:nil setUserId: NO];
}

/**
 * Initialize Amplitude with a given apiKey and userId.
 */
- (void)initializeApiKey:(NSString*) apiKey userId:(NSString*) userId
{
    [self initializeApiKey:apiKey userId:userId setUserId: YES];
}

/**
 * SetUserId: client explicitly initialized with a userId (can be nil).
 * If setUserId is NO, then attempt to load userId from saved eventsData.
 */
- (void)initializeApiKey:(NSString*) apiKey userId:(NSString*) userId setUserId:(BOOL) setUserId
{
    if (apiKey == nil) {
        AMPLITUDE_ERROR(@"ERROR: apiKey cannot be nil in initializeApiKey:");
        return;
    }

    if (![self isArgument:apiKey validType:[NSString class] methodName:@"initializeApiKey:"]) {
        return;
    }
    if (userId != nil && ![self isArgument:userId validType:[NSString class] methodName:@"initializeApiKey:"]) {
        return;
    }

    if ([apiKey length] == 0) {
        AMPLITUDE_ERROR(@"ERROR: apiKey cannot be blank in initializeApiKey:");
        return;
    }

    if (!_initialized) {
        (void) SAFE_ARC_RETAIN(apiKey);
        SAFE_ARC_RELEASE(_apiKey);
        _apiKey = apiKey;

        [self runOnBackgroundQueue:^{
            self->_deviceInfo = [[AMPDeviceInfo alloc] init:self->_disableIdfaTracking];
            [self initializeDeviceId];
            if (setUserId) {
                [self setUserId:userId];
            } else {
                self->_userId = SAFE_ARC_RETAIN([self.dbHelper getValue:USER_ID]);
            }

            __unsafe_unretained __typeof(self) weakSelf = self;
            [self->_dbHelper setDatabaseResetListener:^{
                __strong __typeof(self) strongSelf = weakSelf;
                if (strongSelf) {
                    [strongSelf->_dbHelper insertOrReplaceKeyValue:DEVICE_ID value:strongSelf->_deviceId];
                    [strongSelf->_dbHelper insertOrReplaceKeyValue:USER_ID value:strongSelf->_userId];
                    [strongSelf->_dbHelper insertOrReplaceKeyLongValue:OPT_OUT value:[NSNumber numberWithBool:strongSelf->_optOut]];
                    [strongSelf->_dbHelper insertOrReplaceKeyLongValue:PREVIOUS_SESSION_ID value:[NSNumber numberWithLongLong:strongSelf->_sessionId]];
                    [strongSelf->_dbHelper insertOrReplaceKeyLongValue:PREVIOUS_SESSION_TIME value:[NSNumber numberWithLongLong:strongSelf->_lastEventTime]];
                }
            }];
        }];

        // Normally _inForeground is set by the enterForeground callback, but initializeWithApiKey will be called after the app's enterForeground
        // notification is already triggered, so we need to manually check and set it now.
        // UIApplication methods are only allowed on the main thread so need to dispatch this synchronously to the main thread.
        void (^checkInForeground)(void) = ^{
            UIApplication *app = [self getSharedApplication];
            if (app != nil) {
                UIApplicationState state = app.applicationState;
                if (state != UIApplicationStateBackground) {
                    [self runOnBackgroundQueue:^{
                        long long now = [[self currentTime] timeIntervalSince1970] * 1000;
                        [self startOrContinueSession:now];
                        self->_inForeground = YES;
                    }];

                }
            }
        };
        [self runSynchronouslyOnMainQueue:checkInForeground];
        _initialized = YES;
    }
}

- (UIApplication *)getSharedApplication
{
    Class UIApplicationClass = NSClassFromString(@"UIApplication");
    if (UIApplicationClass && [UIApplicationClass respondsToSelector:@selector(sharedApplication)]) {
        return [UIApplication performSelector:@selector(sharedApplication)];
    }
    return nil;
}

- (void)initializeApiKey:(NSString*) apiKey userId:(NSString*) userId startSession:(BOOL)startSession
{
    [self initializeApiKey:apiKey userId:userId];
}

/**
 * Run a block in the background. If already in the background, run immediately.
 */
- (BOOL)runOnBackgroundQueue:(void (^)(void))block
{
    if ([[NSOperationQueue currentQueue].name isEqualToString:BACKGROUND_QUEUE_NAME]) {
        AMPLITUDE_LOG(@"Already running in the background.");
        block();
        return NO;
    } else {
        [_backgroundQueue addOperationWithBlock:block];
        return YES;
    }
}

/**
 * Run a block on the main thread. If already on the main thread, run immediately.
 */
- (void)runSynchronouslyOnMainQueue:(void (^)(void))block
{
    if ([NSThread isMainThread]) {
        block();
    } else {
        dispatch_sync(dispatch_get_main_queue(), block);
    }
}

#pragma mark - logEvent

- (void)logEvent:(NSString*) eventType
{
    [self logEvent:eventType withEventProperties:nil];
}

- (void)logEvent:(NSString*) eventType withEventProperties:(NSDictionary*) eventProperties
{
    [self logEvent:eventType withEventProperties:eventProperties withGroups:nil];
}

- (void)logEvent:(NSString*) eventType withEventProperties:(NSDictionary*) eventProperties outOfSession:(BOOL) outOfSession
{
    [self logEvent:eventType withEventProperties:eventProperties withGroups:nil outOfSession:outOfSession];
}

- (void)logEvent:(NSString*) eventType withEventProperties:(NSDictionary*) eventProperties withGroups:(NSDictionary*) groups
{
    [self logEvent:eventType withEventProperties:eventProperties withGroups:groups outOfSession:NO];
}

- (void)logEvent:(NSString*) eventType withEventProperties:(NSDictionary*) eventProperties withGroups:(NSDictionary*) groups outOfSession:(BOOL)outOfSession
{
    [self logEvent:eventType withEventProperties:eventProperties withApiProperties:nil withUserProperties:nil withGroups:groups withGroupProperties:nil withTimestamp:nil outOfSession:outOfSession];
}

- (void)logEvent:(NSString*) eventType withEventProperties:(NSDictionary*) eventProperties withGroups:(NSDictionary*) groups withLongLongTimestamp:(long long) timestamp outOfSession:(BOOL)outOfSession
{
    [self logEvent:eventType withEventProperties:eventProperties withApiProperties:nil withUserProperties:nil withGroups:groups withGroupProperties:nil withTimestamp:[NSNumber numberWithLongLong:timestamp] outOfSession:outOfSession];
}

- (void)logEvent:(NSString*) eventType withEventProperties:(NSDictionary*) eventProperties withGroups:(NSDictionary*) groups withTimestamp:(NSNumber*) timestamp outOfSession:(BOOL)outOfSession
{
    [self logEvent:eventType withEventProperties:eventProperties withApiProperties:nil withUserProperties:nil withGroups:groups withGroupProperties:nil withTimestamp:timestamp outOfSession:outOfSession];
}

- (void)logEvent:(NSString*) eventType withEventProperties:(NSDictionary*) eventProperties withApiProperties:(NSDictionary*) apiProperties withUserProperties:(NSDictionary*) userProperties withGroups:(NSDictionary*) groups withGroupProperties:(NSDictionary*) groupProperties withTimestamp:(NSNumber*) timestamp outOfSession:(BOOL) outOfSession
{
    if (_apiKey == nil) {
        AMPLITUDE_ERROR(@"ERROR: apiKey cannot be nil or empty, set apiKey with initializeApiKey: before calling logEvent");
        return;
    }

    if (![self isArgument:eventType validType:[NSString class] methodName:@"logEvent"]) {
        AMPLITUDE_ERROR(@"ERROR: eventType must be an NSString");
        return;
    }
    if (eventProperties != nil && ![self isArgument:eventProperties validType:[NSDictionary class] methodName:@"logEvent"]) {
        AMPLITUDE_ERROR(@"ERROR: eventProperties must by a NSDictionary");
        return;
    }

    if (timestamp == nil) {
        timestamp = [NSNumber numberWithLongLong:[[self currentTime] timeIntervalSince1970] * 1000];
    }

    // Create snapshot of all event json objects, to prevent deallocation crash
    eventProperties = [eventProperties copy];
    apiProperties = [apiProperties mutableCopy];
    userProperties = [userProperties copy];
    groups = [groups copy];
    groupProperties = [groupProperties copy];
    
    [self runOnBackgroundQueue:^{
        // Respect the opt-out setting by not sending or storing any events.
        if (self->_optOut)  {
            AMPLITUDE_LOG(@"User has opted out of tracking. Event %@ not logged.", eventType);
            SAFE_ARC_RELEASE(eventProperties);
            SAFE_ARC_RELEASE(apiProperties);
            SAFE_ARC_RELEASE(userProperties);
            SAFE_ARC_RELEASE(groups);
            SAFE_ARC_RELEASE(groupProperties);
            return;
        }

        // skip session check if logging start_session or end_session events
        BOOL loggingSessionEvent = self->_trackingSessionEvents && ([eventType isEqualToString:kAMPSessionStartEvent] || [eventType isEqualToString:kAMPSessionEndEvent]);
        if (!loggingSessionEvent && !outOfSession) {
            [self startOrContinueSession:[timestamp longLongValue]];
        }

        NSMutableDictionary *event = [NSMutableDictionary dictionary];
        [event setValue:eventType forKey:@"event_type"];
        [event setValue:[self truncate:[AMPUtils makeJSONSerializable:[self replaceWithEmptyJSON:eventProperties]]] forKey:@"event_properties"];
        [event setValue:[self replaceWithEmptyJSON:apiProperties] forKey:@"api_properties"];
        [event setValue:[self truncate:[AMPUtils makeJSONSerializable:[self replaceWithEmptyJSON:userProperties]]] forKey:@"user_properties"];
        [event setValue:[self truncate:[AMPUtils validateGroups:[self replaceWithEmptyJSON:groups]]] forKey:@"groups"];
        [event setValue:[self truncate:[AMPUtils makeJSONSerializable:[self replaceWithEmptyJSON:groupProperties]]] forKey:@"group_properties"];
        [event setValue:[NSNumber numberWithLongLong:outOfSession ? -1 : self->_sessionId] forKey:@"session_id"];
        [event setValue:timestamp forKey:@"timestamp"];

        SAFE_ARC_RELEASE(eventProperties);
        SAFE_ARC_RELEASE(apiProperties);
        SAFE_ARC_RELEASE(userProperties);
        SAFE_ARC_RELEASE(groups);
        SAFE_ARC_RELEASE(groupProperties);

        [self annotateEvent:event];

        // convert event dictionary to JSON String
        NSError *error = nil;
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:[AMPUtils makeJSONSerializable:event] options:0 error:&error];
        if (error != nil) {
            AMPLITUDE_ERROR(@"ERROR: could not JSONSerialize event type %@: %@", eventType, error);
            return;
        }
        NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        if ([AMPUtils isEmptyString:jsonString]) {
            AMPLITUDE_ERROR(@"ERROR: JSONSerializing event type %@ resulted in an NULL string", eventType);
            if (jsonString != nil) {
                SAFE_ARC_RELEASE(jsonString);
            }
            return;
        }
        if ([eventType isEqualToString:IDENTIFY_EVENT] || [eventType isEqualToString:GROUP_IDENTIFY_EVENT]) {
            (void) [self.dbHelper addIdentify:jsonString];
        } else {
            (void) [self.dbHelper addEvent:jsonString];
        }
        SAFE_ARC_RELEASE(jsonString);

        AMPLITUDE_LOG(@"Logged %@ Event", event[@"event_type"]);

        [self truncateEventQueues];

        int eventCount = [self.dbHelper getTotalEventCount]; // refetch since events may have been deleted
        if ((eventCount % self.eventUploadThreshold) == 0 && eventCount >= self.eventUploadThreshold) {
            [self uploadEvents];
        } else {
            [self uploadEventsWithDelay:self.eventUploadPeriodSeconds];
        }
    }];
}

- (void)truncateEventQueues
{
    int numEventsToRemove = MIN(MAX(1, self.eventMaxCount/10), kAMPEventRemoveBatchSize);
    int eventCount = [self.dbHelper getEventCount];
    if (eventCount > self.eventMaxCount) {
        [self.dbHelper removeEvents:([self.dbHelper getNthEventId:numEventsToRemove])];
    }
    int identifyCount = [self.dbHelper getIdentifyCount];
    if (identifyCount > self.eventMaxCount) {
        [self.dbHelper removeIdentifys:([self.dbHelper getNthIdentifyId:numEventsToRemove])];
    }
}

- (void)annotateEvent:(NSMutableDictionary*) event
{
    [event setValue:_userId forKey:@"user_id"];
    [event setValue:_deviceId forKey:@"device_id"];
    if ([self->_trackingOptions shouldTrackPlatform]) {
        [event setValue:kAMPPlatform forKey:@"platform"];
    }
    if ([self->_trackingOptions shouldTrackVersionName]) {
        [event setValue:_deviceInfo.appVersion forKey:@"version_name"];
    }
    if ([self->_trackingOptions shouldTrackOSName]) {
        [event setValue:_deviceInfo.osName forKey:@"os_name"];
    }
    if ([self->_trackingOptions shouldTrackOSVersion]) {
        [event setValue:_deviceInfo.osVersion forKey:@"os_version"];
    }
    if ([self->_trackingOptions shouldTrackDeviceModel]) {
        [event setValue:_deviceInfo.model forKey:@"device_model"];
    }
    if ([self->_trackingOptions shouldTrackDeviceManufacturer]) {
        [event setValue:_deviceInfo.manufacturer forKey:@"device_manufacturer"];
    }
    if ([self->_trackingOptions shouldTrackCarrier]) {
        [event setValue:_deviceInfo.carrier forKey:@"carrier"];
    }
    if ([self->_trackingOptions shouldTrackCountry]) {
        [event setValue:_deviceInfo.country forKey:@"country"];
    }
    if ([self->_trackingOptions shouldTrackLanguage]) {
        [event setValue:_deviceInfo.language forKey:@"language"];
    }
    NSDictionary *library = @{
        @"name": kAMPLibrary,
        @"version": kAMPVersion
    };
    [event setValue:library forKey:@"library"];
    [event setValue:[AMPUtils generateUUID] forKey:@"uuid"];
    [event setValue:[NSNumber numberWithLongLong:[self getNextSequenceNumber]] forKey:@"sequence_number"];

    NSMutableDictionary *apiProperties = [event valueForKey:@"api_properties"];

    NSString* advertiserID = _deviceInfo.advertiserID;
    if ([self->_trackingOptions shouldTrackIDFA] && advertiserID) {
        [apiProperties setValue:advertiserID forKey:@"ios_idfa"];
    }
    NSString* vendorID = _deviceInfo.vendorID;
    if ([self->_trackingOptions shouldTrackIDFV] && vendorID) {
        [apiProperties setValue:vendorID forKey:@"ios_idfv"];
    }
    
    if ([self->_trackingOptions shouldTrackLatLng] && _lastKnownLocation != nil) {
        @synchronized (_locationManager) {
            NSMutableDictionary *location = [NSMutableDictionary dictionary];

            // Need to use NSInvocation because coordinate selector returns a C struct
            SEL coordinateSelector = NSSelectorFromString(@"coordinate");
            NSMethodSignature *coordinateMethodSignature = [_lastKnownLocation methodSignatureForSelector:coordinateSelector];
            NSInvocation *coordinateInvocation = [NSInvocation invocationWithMethodSignature:coordinateMethodSignature];
            [coordinateInvocation setTarget:_lastKnownLocation];
            [coordinateInvocation setSelector:coordinateSelector];
            [coordinateInvocation invoke];
            CLLocationCoordinate2D lastKnownLocationCoordinate;
            [coordinateInvocation getReturnValue:&lastKnownLocationCoordinate];

            [location setValue:[NSNumber numberWithDouble:lastKnownLocationCoordinate.latitude] forKey:@"lat"];
            [location setValue:[NSNumber numberWithDouble:lastKnownLocationCoordinate.longitude] forKey:@"lng"];

            [apiProperties setValue:location forKey:@"location"];
        }
    }

    if (self->_apiPropertiesTrackingOptions.count > 0) {
        [apiProperties setValue:self->_apiPropertiesTrackingOptions forKey:@"tracking_options"];
    }
}

#pragma mark - logRevenue

// amount is a double in units of dollars
// ex. $3.99 would be passed as [NSNumber numberWithDouble:3.99]
- (void)logRevenue:(NSNumber*) amount
{
    [self logRevenue:nil quantity:1 price:amount];
}

- (void)logRevenue:(NSString*) productIdentifier quantity:(NSInteger) quantity price:(NSNumber*) price
{
    [self logRevenue:productIdentifier quantity:quantity price:price receipt:nil];
}

- (void)logRevenue:(NSString*) productIdentifier quantity:(NSInteger) quantity price:(NSNumber*) price receipt:(NSData*) receipt
{
    if (_apiKey == nil) {
        AMPLITUDE_ERROR(@"ERROR: apiKey cannot be nil or empty, set apiKey with initializeApiKey: before calling logRevenue:");
        return;
    }
    if (![self isArgument:price validType:[NSNumber class] methodName:@"logRevenue:"]) {
        return;
    }
    NSDictionary *apiProperties = [NSMutableDictionary dictionary];
    [apiProperties setValue:kAMPRevenueEvent forKey:@"special"];
    [apiProperties setValue:productIdentifier forKey:@"productId"];
    [apiProperties setValue:[NSNumber numberWithInteger:quantity] forKey:@"quantity"];
    [apiProperties setValue:price forKey:@"price"];

    if ([receipt respondsToSelector:@selector(base64EncodedStringWithOptions:)]) {
        [apiProperties setValue:[receipt base64EncodedStringWithOptions:0] forKey:@"receipt"];
    } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated"
        [apiProperties setValue:[receipt base64Encoding] forKey:@"receipt"];
#pragma clang diagnostic pop
    }

    [self logEvent:kAMPRevenueEvent withEventProperties:nil withApiProperties:apiProperties withUserProperties:nil withGroups:nil withGroupProperties:nil withTimestamp:nil outOfSession:NO];
}

- (void)logRevenueV2:(AMPRevenue*) revenue
{
    if (_apiKey == nil) {
        AMPLITUDE_ERROR(@"ERROR: apiKey cannot be nil or empty, set apiKey with initializeApiKey: before calling logRevenueV2");
        return;
    }
    if (revenue == nil || ![revenue isValidRevenue]) {
        return;
    }

    [self logEvent:kAMPRevenueEvent withEventProperties:[revenue toNSDictionary]];
}

#pragma mark - Upload events

- (void)uploadEventsWithDelay:(int) delay
{
    if (!_updateScheduled) {
        _updateScheduled = YES;
        __block __weak Amplitude *weakSelf = self;
        [_backgroundQueue addOperationWithBlock:^{
            dispatch_async(dispatch_get_main_queue(), ^{
                [weakSelf performSelector:@selector(uploadEventsInBackground) withObject:nil afterDelay:delay];
            });
        }];
    }
}

- (void)uploadEventsInBackground
{
    _updateScheduled = NO;
    [self uploadEvents];
}

- (void)uploadEvents
{
    int limit = _backoffUpload ? _backoffUploadBatchSize : self.eventUploadMaxBatchSize;
    [self uploadEventsWithLimit:limit];
}

- (void)uploadEventsWithLimit:(int) limit
{
    if (_apiKey == nil) {
        AMPLITUDE_ERROR(@"ERROR: apiKey cannot be nil or empty, set apiKey with initializeApiKey: before calling uploadEvents:");
        return;
    }

    @synchronized (self) {
        if (_updatingCurrently) {
            return;
        }
        _updatingCurrently = YES;
    }
    
    [self runOnBackgroundQueue:^{

        // Don't communicate with the server if the user has opted out.
        if (self->_optOut || self->_offline)  {
            self->_updatingCurrently = NO;
            return;
        }

        long eventCount = [self.dbHelper getTotalEventCount];
        long numEvents = limit > 0 ? fminl(eventCount, limit) : eventCount;
        if (numEvents == 0) {
            self->_updatingCurrently = NO;
            return;
        }
        NSMutableArray *events = [self.dbHelper getEvents:-1 limit:numEvents];
        NSMutableArray *identifys = [self.dbHelper getIdentifys:-1 limit:numEvents];
        NSDictionary *merged = [self mergeEventsAndIdentifys:events identifys:identifys numEvents:numEvents];

        NSMutableArray *uploadEvents = [merged objectForKey:EVENTS];
        long long maxEventId = [[merged objectForKey:MAX_EVENT_ID] longLongValue];
        long long maxIdentifyId = [[merged objectForKey:MAX_IDENTIFY_ID] longLongValue];

        NSError *error = nil;
        NSData *eventsDataLocal = nil;
        eventsDataLocal = [NSJSONSerialization dataWithJSONObject:uploadEvents options:0 error:&error];
        if (error != nil) {
            AMPLITUDE_ERROR(@"ERROR: NSJSONSerialization error: %@", error);
            self->_updatingCurrently = NO;
            return;
        }

        NSString *eventsString = [[NSString alloc] initWithData:eventsDataLocal encoding:NSUTF8StringEncoding];
        if ([AMPUtils isEmptyString:eventsString]) {
            AMPLITUDE_ERROR(@"ERROR: JSONSerialization of event upload data resulted in a NULL string");
            if (eventsString != nil) {
                SAFE_ARC_RELEASE(eventsString);
            }
            self->_updatingCurrently = NO;
            return;
        }

        [self makeEventUploadPostRequest:self->_serverUrl events:eventsString numEvents:numEvents maxEventId:maxEventId maxIdentifyId:maxIdentifyId];
        SAFE_ARC_RELEASE(eventsString);
    }];
}

- (long long)getNextSequenceNumber
{
    NSNumber *sequenceNumberFromDB = [self.dbHelper getLongValue:SEQUENCE_NUMBER];
    long long sequenceNumber = 0;
    if (sequenceNumberFromDB != nil) {
        sequenceNumber = [sequenceNumberFromDB longLongValue];
    }

    sequenceNumber++;
    [self.dbHelper insertOrReplaceKeyLongValue:SEQUENCE_NUMBER value:[NSNumber numberWithLongLong:sequenceNumber]];

    return sequenceNumber;
}

- (NSDictionary*)mergeEventsAndIdentifys:(NSMutableArray*)events identifys:(NSMutableArray*)identifys numEvents:(long) numEvents
{
    NSMutableArray *mergedEvents = [[NSMutableArray alloc] init];
    long long maxEventId = -1;
    long long maxIdentifyId = -1;

    // NSArrays actually have O(1) performance for push/pop
    while ([mergedEvents count] < numEvents) {
        NSDictionary *event = nil;
        NSDictionary *identify = nil;

        BOOL noIdentifies = [identifys count] == 0;
        BOOL noEvents = [events count] == 0;

        // case 0: no events or identifies, should not happen - means less events / identifies than expected
        if (noEvents && noIdentifies) {
            break;
        }

        // case 1: no identifys grab from events
        if (noIdentifies) {
            event = SAFE_ARC_RETAIN(events[0]);
            [events removeObjectAtIndex:0];
            maxEventId = [[event objectForKey:@"event_id"] longValue];

        // case 2: no events grab from identifys
        } else if (noEvents) {
            identify = SAFE_ARC_RETAIN(identifys[0]);
            [identifys removeObjectAtIndex:0];
            maxIdentifyId = [[identify objectForKey:@"event_id"] longValue];

        // case 3: need to compare sequence numbers
        } else {
            // events logged before v3.2.0 won't have sequeunce number, put those first
            event = SAFE_ARC_RETAIN(events[0]);
            identify = SAFE_ARC_RETAIN(identifys[0]);
            if ([event objectForKey:SEQUENCE_NUMBER] == nil ||
                    ([[event objectForKey:SEQUENCE_NUMBER] longLongValue] <
                     [[identify objectForKey:SEQUENCE_NUMBER] longLongValue])) {
                [events removeObjectAtIndex:0];
                maxEventId = [[event objectForKey:EVENT_ID] longValue];
                SAFE_ARC_RELEASE(identify);
                identify = nil;
            } else {
                [identifys removeObjectAtIndex:0];
                maxIdentifyId = [[identify objectForKey:EVENT_ID] longValue];
                SAFE_ARC_RELEASE(event);
                event = nil;
            }
        }

        [mergedEvents addObject: event != nil ? event : identify];
        SAFE_ARC_RELEASE(event);
        SAFE_ARC_RELEASE(identify);
    }

    NSDictionary *results = [[NSDictionary alloc] initWithObjectsAndKeys: mergedEvents, EVENTS, [NSNumber numberWithLongLong:maxEventId], MAX_EVENT_ID, [NSNumber numberWithLongLong:maxIdentifyId], MAX_IDENTIFY_ID, nil];
    SAFE_ARC_RELEASE(mergedEvents);
    return SAFE_ARC_AUTORELEASE(results);
}

- (void)makeEventUploadPostRequest:(NSString*) url events:(NSString*) events numEvents:(long) numEvents maxEventId:(long long) maxEventId maxIdentifyId:(long long) maxIdentifyId
{
    NSMutableURLRequest *request =[NSMutableURLRequest requestWithURL:[NSURL URLWithString:url]];
    [request setTimeoutInterval:60.0];

    NSString *apiVersionString = [[NSNumber numberWithInt:kAMPApiVersion] stringValue];

    NSMutableData *postData = [[NSMutableData alloc] init];
    [postData appendData:[@"v=" dataUsingEncoding:NSUTF8StringEncoding]];
    [postData appendData:[apiVersionString dataUsingEncoding:NSUTF8StringEncoding]];
    [postData appendData:[@"&client=" dataUsingEncoding:NSUTF8StringEncoding]];
    [postData appendData:[_apiKey dataUsingEncoding:NSUTF8StringEncoding]];
    [postData appendData:[@"&e=" dataUsingEncoding:NSUTF8StringEncoding]];
    [postData appendData:[[self urlEncodeString:events] dataUsingEncoding:NSUTF8StringEncoding]];

    // Add timestamp of upload
    [postData appendData:[@"&upload_time=" dataUsingEncoding:NSUTF8StringEncoding]];
    NSString *timestampString = [[NSNumber numberWithLongLong:[[self currentTime] timeIntervalSince1970] * 1000] stringValue];
    [postData appendData:[timestampString dataUsingEncoding:NSUTF8StringEncoding]];

    // Add checksum
    [postData appendData:[@"&checksum=" dataUsingEncoding:NSUTF8StringEncoding]];
    NSString *checksumData = [NSString stringWithFormat: @"%@%@%@%@", apiVersionString, _apiKey, events, timestampString];
    NSString *checksum = [self md5HexDigest: checksumData];
    [postData appendData:[checksum dataUsingEncoding:NSUTF8StringEncoding]];

    [request setHTTPMethod:@"POST"];
    [request setValue:@"application/x-www-form-urlencoded" forHTTPHeaderField:@"Content-Type"];
    [request setValue:[NSString stringWithFormat:@"%lu", (unsigned long)[postData length]] forHTTPHeaderField:@"Content-Length"];

    [request setHTTPBody:postData];
    AMPLITUDE_LOG(@"Events: %@", events);

    SAFE_ARC_RELEASE(postData);

    // If pinning is enabled, use the AMPURLSession that handles it.
#if AMPLITUDE_SSL_PINNING
    id session = (self.sslPinningEnabled ? [AMPURLSession class] : [NSURLSession class]);
#else
    id session = [NSURLSession class];
#endif
    [[[session sharedSession] dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        BOOL uploadSuccessful = NO;
        NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse*)response;
        if (response != nil) {
            if ([httpResponse statusCode] == 200) {
                NSString *result = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                if ([result isEqualToString:@"success"]) {
                    // success, remove existing events from dictionary
                    uploadSuccessful = YES;
                    if (maxEventId >= 0) {
                        (void) [self.dbHelper removeEvents:maxEventId];
                    }
                    if (maxIdentifyId >= 0) {
                        (void) [self.dbHelper removeIdentifys:maxIdentifyId];
                    }
                } else if ([result isEqualToString:@"invalid_api_key"]) {
                    AMPLITUDE_ERROR(@"ERROR: Invalid API Key, make sure your API key is correct in initializeApiKey:");
                } else if ([result isEqualToString:@"bad_checksum"]) {
                    AMPLITUDE_ERROR(@"ERROR: Bad checksum, post request was mangled in transit, will attempt to reupload later");
                } else if ([result isEqualToString:@"request_db_write_failed"]) {
                    AMPLITUDE_ERROR(@"ERROR: Couldn't write to request database on server, will attempt to reupload later");
                } else {
                    AMPLITUDE_ERROR(@"ERROR: %@, will attempt to reupload later", result);
                }
                SAFE_ARC_RELEASE(result);
            } else if ([httpResponse statusCode] == 413) {
                // If blocked by one massive event, drop it
                if (numEvents == 1) {
                    if (maxEventId >= 0) {
                        (void) [self.dbHelper removeEvent: maxEventId];
                    }
                    if (maxIdentifyId >= 0) {
                        (void) [self.dbHelper removeIdentifys: maxIdentifyId];
                    }
                }

                // server complained about length of request, backoff and try again
                self->_backoffUpload = YES;
                long newNumEvents = MIN(numEvents, self->_backoffUploadBatchSize);
                self->_backoffUploadBatchSize = MAX((int)ceilf(newNumEvents / 2.0f), 1);
                AMPLITUDE_LOG(@"Request too large, will decrease size and attempt to reupload");
                self->_updatingCurrently = NO;
                [self uploadEventsWithLimit:self->_backoffUploadBatchSize];

            } else {
                AMPLITUDE_ERROR(@"ERROR: Connection response received:%ld, %@", (long)[httpResponse statusCode],
                    SAFE_ARC_AUTORELEASE([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]));
            }
        } else if (error != nil) {
            if ([error code] == -1009) {
                AMPLITUDE_LOG(@"No internet connection (not connected to internet), unable to upload events");
            } else if ([error code] == -1003) {
                AMPLITUDE_LOG(@"No internet connection (hostname not found), unable to upload events");
            } else if ([error code] == -1001) {
                AMPLITUDE_LOG(@"No internet connection (request timed out), unable to upload events");
            } else {
                AMPLITUDE_ERROR(@"ERROR: Connection error:%@", error);
            }
        } else {
            AMPLITUDE_ERROR(@"ERROR: response empty, error empty for NSURLConnection");
        }

        self->_updatingCurrently = NO;

        if (uploadSuccessful && [self.dbHelper getEventCount] > self.eventUploadThreshold) {
            int limit = self->_backoffUpload ? self->_backoffUploadBatchSize : 0;
            [self uploadEventsWithLimit:limit];

        } else if (self->_uploadTaskID != UIBackgroundTaskInvalid) {
            if (uploadSuccessful) {
                self->_backoffUpload = NO;
                self->_backoffUploadBatchSize = self.eventUploadMaxBatchSize;
            }

            // Upload finished, allow background task to be ended
            [self endBackgroundTaskIfNeeded];
        }
    }] resume];
}

#pragma mark - application lifecycle methods

- (void)enterForeground
{
    UIApplication *app = [self getSharedApplication];
    if (app == nil) {
        return;
    }

    [self updateLocation];

    long long now = [[self currentTime] timeIntervalSince1970] * 1000;

    // Stop uploading
    [self endBackgroundTaskIfNeeded];
    [self runOnBackgroundQueue:^{
        [self startOrContinueSession:now];
        self->_inForeground = YES;
        [self uploadEvents];
    }];
}

- (void)enterBackground
{
    UIApplication *app = [self getSharedApplication];
    if (app == nil) {
        return;
    }

    long long now = [[self currentTime] timeIntervalSince1970] * 1000;

    // Stop uploading
    [self endBackgroundTaskIfNeeded];
    _uploadTaskID = [app beginBackgroundTaskWithExpirationHandler:^{
        //Took too long, manually stop
        [self endBackgroundTaskIfNeeded];
    }];
    [self runOnBackgroundQueue:^{
        self->_inForeground = NO;
        [self refreshSessionTime:now];
        [self uploadEventsWithLimit:0];

        // persist metadata back into database
        [self->_dbHelper insertOrReplaceKeyValue:DEVICE_ID value:self->_deviceId];
        [self->_dbHelper insertOrReplaceKeyValue:USER_ID value:self->_userId];
        [self->_dbHelper insertOrReplaceKeyLongValue:OPT_OUT value:[NSNumber numberWithBool:self->_optOut]];
        [self->_dbHelper insertOrReplaceKeyLongValue:PREVIOUS_SESSION_ID value:[NSNumber numberWithLongLong:self->_sessionId]];
        [self->_dbHelper insertOrReplaceKeyLongValue:PREVIOUS_SESSION_TIME value:[NSNumber numberWithLongLong:self->_lastEventTime]];

        [self endBackgroundTaskIfNeeded];
    }];
}

- (void)endBackgroundTaskIfNeeded
{
    UIApplication *app = [self getSharedApplication];
    if (app == nil) {
        return;
    }
    if (_uploadTaskID != UIBackgroundTaskInvalid) {
        [app endBackgroundTask:_uploadTaskID];
        self->_uploadTaskID = UIBackgroundTaskInvalid;
    }
}

#pragma mark - Sessions

/**
 * Creates a new session if we are in the background and
 * the current session is expired or if there is no current session ID].
 * Otherwise extends the session.
 *
 * Returns YES if a new session was created.
 */
- (BOOL)startOrContinueSession:(long long) timestamp
{
    if (!_inForeground) {
        if ([self inSession]) {
            if ([self isWithinMinTimeBetweenSessions:timestamp]) {
                [self refreshSessionTime:timestamp];
                return NO;
            }
            [self startNewSession:timestamp];
            return YES;
        }
        // no current session, check for previous session
        if ([self isWithinMinTimeBetweenSessions:timestamp]) {
            // extract session id
            long long previousSessionId = [self previousSessionId];
            if (previousSessionId == -1) {
                [self startNewSession:timestamp];
                return YES;
            }
            // extend previous session
            [self setSessionId:previousSessionId];
            [self refreshSessionTime:timestamp];
            return NO;
        } else {
            [self startNewSession:timestamp];
            return YES;
        }
    }
    // not creating a session means we should continue the session
    [self refreshSessionTime:timestamp];
    return NO;
}

- (void)startNewSession:(long long) timestamp
{
    if (_trackingSessionEvents) {
        [self sendSessionEvent:kAMPSessionEndEvent];
    }
    [self setSessionId:timestamp];
    [self refreshSessionTime:timestamp];
    if (_trackingSessionEvents) {
        [self sendSessionEvent:kAMPSessionStartEvent];
    }
}

- (void)sendSessionEvent:(NSString*) sessionEvent
{
    if (_apiKey == nil) {
        AMPLITUDE_ERROR(@"ERROR: apiKey cannot be nil or empty, set apiKey with initializeApiKey: before sending session event");
        return;
    }

    if (![self inSession]) {
        return;
    }

    NSMutableDictionary *apiProperties = [NSMutableDictionary dictionary];
    [apiProperties setValue:sessionEvent forKey:@"special"];
    NSNumber *timestamp = [NSNumber numberWithLongLong:self->_lastEventTime];
    [self logEvent:sessionEvent withEventProperties:nil withApiProperties:apiProperties withUserProperties:nil withGroups:nil withGroupProperties:nil withTimestamp:timestamp outOfSession:NO];
}

- (BOOL)inSession
{
    return _sessionId >= 0;
}

- (BOOL)isWithinMinTimeBetweenSessions:(long long) timestamp
{
    return (timestamp - self->_lastEventTime) < self.minTimeBetweenSessionsMillis;
}

/**
 * Sets the session ID in memory and persists it to disk.
 */
- (void)setSessionId:(long long) timestamp
{
    self->_sessionId = timestamp;
    [self setPreviousSessionId:_sessionId];
}

/**
 * Update the session timer if there's a running session.
 */
- (void)refreshSessionTime:(long long) timestamp
{
    if (![self inSession]) {
        return;
    }
    [self setLastEventTime:timestamp];
}

- (void)setPreviousSessionId:(long long) previousSessionId
{
    NSNumber *value = [NSNumber numberWithLongLong:previousSessionId];
    (void) [self.dbHelper insertOrReplaceKeyLongValue:PREVIOUS_SESSION_ID value:value];
}

- (long long)previousSessionId
{
    NSNumber* previousSessionId = [self.dbHelper getLongValue:PREVIOUS_SESSION_ID];
    if (previousSessionId == nil) {
        return -1;
    }
    return [previousSessionId longLongValue];
}

- (void)setLastEventTime:(long long) timestamp
{
    self->_lastEventTime = timestamp;
    NSNumber *value = [NSNumber numberWithLongLong:timestamp];
    (void) [self.dbHelper insertOrReplaceKeyLongValue:PREVIOUS_SESSION_TIME value:value];
}

- (long long)getLastEventTime
{
    NSNumber *lastEventTime = [self.dbHelper getLongValue:PREVIOUS_SESSION_TIME];
    if (lastEventTime == nil) {
        return -1;
    }
    return [lastEventTime longLongValue];
}

- (void)startSession
{
    return;
}

- (void)identify:(AMPIdentify *)identify
{
    [self identify:identify outOfSession:NO];
}

- (void)identify:(AMPIdentify *)identify outOfSession:(BOOL) outOfSession
{
    if (identify == nil || [identify.userPropertyOperations count] == 0) {
        return;
    }
    [self logEvent:IDENTIFY_EVENT withEventProperties:nil withApiProperties:nil withUserProperties:identify.userPropertyOperations withGroups:nil withGroupProperties:nil withTimestamp:nil outOfSession:outOfSession];
}

- (void)groupIdentifyWithGroupType:(NSString*)groupType groupName:(NSObject*)groupName groupIdentify:(AMPIdentify *)groupIdentify
{
    [self groupIdentifyWithGroupType:groupType groupName:groupName groupIdentify:groupIdentify outOfSession:NO];
}

- (void)groupIdentifyWithGroupType:(NSString*)groupType groupName:(NSObject*)groupName groupIdentify:(AMPIdentify *)groupIdentify outOfSession:(BOOL) outOfSession
{
    if (groupIdentify == nil || [groupIdentify.userPropertyOperations count] == 0) {
        return;
    }

    if (groupType == nil || [groupType isEqualToString:@""]) {
        AMPLITUDE_LOG(@"ERROR: groupType cannot be nil or an empty string");
        return;
    }

    NSMutableDictionary *groups = [NSMutableDictionary dictionaryWithObjectsAndKeys:groupName, groupType, nil];
    [self logEvent:GROUP_IDENTIFY_EVENT withEventProperties:nil withApiProperties:nil withUserProperties:nil withGroups:groups withGroupProperties:groupIdentify.userPropertyOperations withTimestamp:nil outOfSession:outOfSession];
}

#pragma mark - configurations

- (void)setUserProperties:(NSDictionary*) userProperties
{
    if (userProperties == nil || ![self isArgument:userProperties validType:[NSDictionary class] methodName:@"setUserProperties:"] || [userProperties count] == 0) {
        return;
    }

    NSDictionary *copy = [userProperties copy];
    [self runOnBackgroundQueue:^{
        // sanitize and truncate user properties before turning into identify
        NSDictionary *sanitized = [self truncate:copy];
        if ([sanitized count] == 0) {
            return;
        }

        AMPIdentify *identify = [AMPIdentify identify];
        for (NSString *key in copy) {
            NSObject *value = [copy objectForKey:key];
            [identify set:key value:value];
        }
        [self identify:identify];
    }];
}

// maintain for legacy
// replace argument is deprecated. In earlier versions of this SDK, this replaced the in-memory userProperties dictionary with the input, but now userProperties are no longer stored in memory.
- (void)setUserProperties:(NSDictionary*) userProperties replace:(BOOL) replace
{
    [self setUserProperties:userProperties];
}

- (void)clearUserProperties
{
    AMPIdentify *identify = [[AMPIdentify identify] clearAll];
    [self identify:identify];
}

- (void)setGroup:(NSString *)groupType groupName:(NSObject *)groupName
{
    if (_apiKey == nil) {
        AMPLITUDE_ERROR(@"ERROR: apiKey cannot be nil or empty, set apiKey with initializeApiKey: before calling setGroupType");
        return;
    }

    if (groupType == nil || [groupType isEqualToString:@""]) {
        AMPLITUDE_LOG(@"ERROR: groupType cannot be nil or an empty string");
        return;
    }

    NSMutableDictionary *groups = [NSMutableDictionary dictionaryWithObjectsAndKeys:groupName, groupType, nil];
    AMPIdentify *identify = [[AMPIdentify identify] set:groupType value:groupName];
    [self logEvent:IDENTIFY_EVENT withEventProperties:nil withApiProperties:nil withUserProperties:identify.userPropertyOperations withGroups:groups withGroupProperties:nil withTimestamp:nil outOfSession:NO];

}

- (void)setTrackingOptions:(AMPTrackingOptions *) options
{
    if (![self isArgument:options validType:[AMPTrackingOptions class] methodName:@"setTrackingOptions:"]) {
        return;
    }

    (void) SAFE_ARC_RETAIN(options);
    SAFE_ARC_RELEASE(self->_trackingOptions);
    SAFE_ARC_RELEASE(self->_apiPropertiesTrackingOptions);
    self->_trackingOptions = options;
    self->_apiPropertiesTrackingOptions = SAFE_ARC_RETAIN([NSDictionary dictionaryWithDictionary:[options getApiPropertiesTrackingOption]]);
}

- (void)setUserId:(NSString*) userId
{
    [self setUserId:userId startNewSession:NO];
}

- (void)setUserId:(NSString*) userId startNewSession:(BOOL) startNewSession
{
    if (!(userId == nil || [self isArgument:userId validType:[NSString class] methodName:@"setUserId:"])) {
        return;
    }

    [self runOnBackgroundQueue:^{
        if (startNewSession && self->_trackingSessionEvents) {
            [self sendSessionEvent:kAMPSessionEndEvent];
        }

        (void) SAFE_ARC_RETAIN(userId);
        SAFE_ARC_RELEASE(self->_userId);
        self->_userId = userId;
        (void) [self.dbHelper insertOrReplaceKeyValue:USER_ID value:self->_userId];

        if (startNewSession) {
            long long timestamp = [[self currentTime] timeIntervalSince1970] * 1000;
            [self setSessionId:timestamp];
            [self refreshSessionTime:timestamp];
            if (self->_trackingSessionEvents) {
                [self sendSessionEvent:kAMPSessionStartEvent];
            }
        }
    }];
}

- (void)setOptOut:(BOOL)enabled
{
    [self runOnBackgroundQueue:^{
        self->_optOut = enabled;
        NSNumber *value = [NSNumber numberWithBool:enabled];
        (void) [self.dbHelper insertOrReplaceKeyLongValue:OPT_OUT value:value];
    }];
}

- (void)setOffline:(BOOL)offline
{
    _offline = offline;

    if (!_offline) {
        [self uploadEvents];
    }
}

- (void)setServerUrl:(NSString*) serverUrl
{
    if (!(serverUrl == nil || [self isArgument:serverUrl validType:[NSString class] methodName:@"setServerUrl:"])) {
        return;
    }

    (void) SAFE_ARC_RETAIN(serverUrl);
    SAFE_ARC_RELEASE(self->_serverUrl);
    self->_serverUrl = serverUrl;
}

- (void)setEventUploadMaxBatchSize:(int) eventUploadMaxBatchSize
{
    _eventUploadMaxBatchSize = eventUploadMaxBatchSize;
    _backoffUploadBatchSize = eventUploadMaxBatchSize;
}

- (BOOL)loadOptOut
{
    NSNumber *value = [self.dbHelper getLongValue:OPT_OUT];
    if (value == nil) {
        return NO;
    }
    return [value boolValue];
}

- (void)setDeviceId:(NSString*)deviceId
{
    if (![self isValidDeviceId:deviceId]) {
        return;
    }

    [self runOnBackgroundQueue:^{
        (void) SAFE_ARC_RETAIN(deviceId);
        SAFE_ARC_RELEASE(self->_deviceId);
        self->_deviceId = deviceId;
        (void) [self.dbHelper insertOrReplaceKeyValue:DEVICE_ID value:deviceId];
    }];
}

- (void)regenerateDeviceId
{
    [self runOnBackgroundQueue:^{
        [self setDeviceId:[AMPDeviceInfo generateUUID]];
    }];
}

#pragma mark - location methods

- (void)updateLocation
{
    if (_locationListeningEnabled) {
        CLLocation *location = [_locationManager location];
        @synchronized (_locationManager) {
            if (location != nil) {
                (void) SAFE_ARC_RETAIN(location);
                SAFE_ARC_RELEASE(_lastKnownLocation);
                _lastKnownLocation = location;
            }
        }
    }
}

- (void)enableLocationListening
{
    _locationListeningEnabled = YES;
    [self updateLocation];
}

- (void)disableLocationListening
{
    _locationListeningEnabled = NO;
}

- (void)useAdvertisingIdForDeviceId
{
    _useAdvertisingIdForDeviceId = YES;
}

- (void)disableIdfaTracking
{
    _disableIdfaTracking = YES;
}

#pragma mark - Getters for device data
- (NSString*) getDeviceId
{
    return _deviceId;
}

- (long long) getSessionId
{
    return _sessionId;
}

- (BOOL) getOptOut
{
    return _optOut;
}

- (NSString*) initializeDeviceId
{
    if (_deviceId == nil) {
        _deviceId = SAFE_ARC_RETAIN([self.dbHelper getValue:DEVICE_ID]);
        if (![self isValidDeviceId:_deviceId]) {
            NSString *newDeviceId = SAFE_ARC_RETAIN([self _getDeviceId]);
            SAFE_ARC_RELEASE(_deviceId);
            _deviceId = newDeviceId;
            (void) [self.dbHelper insertOrReplaceKeyValue:DEVICE_ID value:newDeviceId];
        }
    }
    return _deviceId;
}

- (NSString*)_getDeviceId
{
    NSString *deviceId = nil;
    if (_useAdvertisingIdForDeviceId && [self->_trackingOptions shouldTrackIDFA]) {
        deviceId = _deviceInfo.advertiserID;
    }

    // return identifierForVendor
    if ([self->_trackingOptions shouldTrackIDFV] && !deviceId) {
        deviceId = _deviceInfo.vendorID;
    }

    if (!deviceId) {
        // Otherwise generate random ID
        deviceId = [AMPDeviceInfo generateUUID];
    }
    return SAFE_ARC_AUTORELEASE([[NSString alloc] initWithString:deviceId]);
}

- (BOOL)isValidDeviceId:(NSString*)deviceId
{
    if (deviceId == nil ||
        ![self isArgument:deviceId validType:[NSString class] methodName:@"isValidDeviceId"] ||
        [deviceId isEqualToString:@"e3f5536a141811db40efd6400f1d0a4e"] ||
        [deviceId isEqualToString:@"04bab7ee75b9a58d39b8dc54e8851084"]) {
        return NO;
    }
    return YES;
}

- (NSDictionary*)replaceWithEmptyJSON:(NSDictionary*) dictionary
{
    return dictionary == nil ? [NSMutableDictionary dictionary] : dictionary;
}

- (id) truncate:(id) obj
{
    if ([obj isKindOfClass:[NSString class]]) {
        obj = (NSString*)obj;
        if ([obj length] > kAMPMaxStringLength) {
            obj = [obj substringToIndex:kAMPMaxStringLength];
        }
    } else if ([obj isKindOfClass:[NSArray class]]) {
        NSMutableArray *arr = [NSMutableArray array];
        id objCopy = [obj copy];
        for (id i in objCopy) {
            [arr addObject:[self truncate:i]];
        }
        SAFE_ARC_RELEASE(objCopy);
        obj = [NSArray arrayWithArray:arr];
    } else if ([obj isKindOfClass:[NSDictionary class]]) {
        // if too many properties, ignore
        if ([(NSDictionary *)obj count] > kAMPMaxPropertyKeys) {
            AMPLITUDE_LOG(@"WARNING: too many properties (more than 1000), ignoring");
            return [NSDictionary dictionary];
        }

        NSMutableDictionary *dict = [NSMutableDictionary dictionary];
        id objCopy = [obj copy];
        for (id key in objCopy) {
            NSString *coercedKey;
            if (![key isKindOfClass:[NSString class]]) {
                coercedKey = [key description];
                AMPLITUDE_LOG(@"WARNING: Non-string property key, received %@, coercing to %@", [key class], coercedKey);
            } else {
                coercedKey = key;
            }
            // do not truncate revenue receipt field
            if ([coercedKey isEqualToString:AMP_REVENUE_RECEIPT]) {
                dict[coercedKey] = objCopy[key];
            } else {
                dict[coercedKey] = [self truncate:objCopy[key]];
            }
        }
        SAFE_ARC_RELEASE(objCopy);
        obj = [NSDictionary dictionaryWithDictionary:dict];
    }
    return obj;
}

- (BOOL)isArgument:(id) argument validType:(Class) class methodName:(NSString*) methodName
{
    if ([argument isKindOfClass:class]) {
        return YES;
    } else {
        AMPLITUDE_ERROR(@"ERROR: Invalid type argument to method %@, expected %@, received %@, ", methodName, class, [argument class]);
        return NO;
    }
}

- (NSString*)md5HexDigest:(NSString*)input
{
    const char* str = [input UTF8String];
    unsigned char result[CC_MD5_DIGEST_LENGTH];
    CC_MD5(str, (CC_LONG) strlen(str), result);

    NSMutableString *ret = [NSMutableString stringWithCapacity:CC_MD5_DIGEST_LENGTH*2];
    for(int i = 0; i<CC_MD5_DIGEST_LENGTH; i++) {
        [ret appendFormat:@"%02x",result[i]];
    }
    return ret;
}

- (NSString*)urlEncodeString:(NSString*) string
{
    NSCharacterSet * allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:@":/?#[]@!$ &'()*+,;=\"<>%{}|\\^~`"] invertedSet];
    return [string stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

- (NSDate*) currentTime
{
    return [NSDate date];
}

- (void)printEventsCount
{
    AMPLITUDE_LOG(@"Events count:%ld", (long) [self.dbHelper getEventCount]);
}

#pragma mark - Compatibility


/**
 * Move all preference data from the legacy name to the new, static name if needed.
 *
 * Data used to be in the NSCachesDirectory, which would sometimes be cleared unexpectedly,
 * resulting in data loss. We move the data from NSCachesDirectory to the current
 * location in NSLibraryDirectory.
 *
 */
- (BOOL)upgradePrefs
{
    // Copy any old data files to new file paths
    NSString *oldEventsDataDirectory = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) objectAtIndex: 0];
    NSString *oldPropertyListPath = [oldEventsDataDirectory stringByAppendingPathComponent:@"com.amplitude.plist"];
    NSString *oldEventsDataPath = [oldEventsDataDirectory stringByAppendingPathComponent:@"com.amplitude.archiveDict"];
    BOOL success = [self moveFileIfNotExists:oldPropertyListPath to:_propertyListPath];
    success &= [self moveFileIfNotExists:oldEventsDataPath to:_eventsDataPath];
    return success;
}

#pragma mark - Filesystem

- (BOOL)savePropertyList {
    @synchronized (_propertyList) {
        BOOL success = [self serializePList:_propertyList toFile:_propertyListPath];
        if (!success) {
            AMPLITUDE_ERROR(@"Error: Unable to save propertyList to file");
        }
        return success;
    }
}

- (id)deserializePList:(NSString*)path {
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
        NSData *pListData = [[NSFileManager defaultManager] contentsAtPath:path];
        if (pListData != nil) {
            NSError *error = nil;
            NSMutableDictionary *pList = (NSMutableDictionary *)[NSPropertyListSerialization
                                                                   propertyListWithData:pListData
                                                                   options:NSPropertyListMutableContainersAndLeaves
                                                                   format:NULL error:&error];
            if (error == nil) {
                return pList;
            } else {
                AMPLITUDE_ERROR(@"ERROR: propertyList deserialization error:%@", error);
                error = nil;
                [[NSFileManager defaultManager] removeItemAtPath:path error:&error];
                if (error != nil) {
                    AMPLITUDE_ERROR(@"ERROR: Can't remove corrupt propertyList file:%@", error);
                }
            }
        }
    }
    return nil;
}

- (BOOL)serializePList:(id)data toFile:(NSString*)path {
    NSError *error = nil;
    NSData *propertyListData = [NSPropertyListSerialization
                                dataWithPropertyList:data
                                format:NSPropertyListXMLFormat_v1_0
                                options:0 error:&error];
    if (error == nil) {
        if (propertyListData != nil) {
            BOOL success = [propertyListData writeToFile:path atomically:YES];
            if (!success) {
                AMPLITUDE_ERROR(@"ERROR: Unable to save propertyList to file");
            }
            return success;
        } else {
            AMPLITUDE_ERROR(@"ERROR: propertyListData is nil");
        }
    } else {
        AMPLITUDE_ERROR(@"ERROR: Unable to serialize propertyList:%@", error);
    }
    return NO;

}

- (id)unarchive:(NSString*)path {
    // unarchive using new NSKeyedUnarchiver method from iOS 9.0 that doesn't throw exceptions
    if (@available(iOS 9.0, *)) {
        NSFileManager *fileManager = [NSFileManager defaultManager];
        if ([fileManager fileExistsAtPath:path]) {
            NSData *inputData = [fileManager contentsAtPath:path];
            NSError *error = nil;
            if (inputData != nil) {
                id data = [NSKeyedUnarchiver unarchiveTopLevelObjectWithData:inputData error:&error];
                if (error == nil) {
                    if (data != nil) {
                        return data;
                    } else {
                        AMPLITUDE_ERROR(@"ERROR: unarchived data is nil for file: %@", path);
                    }
                } else {
                    AMPLITUDE_ERROR(@"ERROR: Unable to unarchive file %@: %@", path, error);
                }
            } else {
                AMPLITUDE_ERROR(@"ERROR: File data is nil for file: %@", path);
            }

            // if reach here, then an error occured during unarchiving, delete corrupt file
            [fileManager removeItemAtPath:path error:&error];
            if (error != nil) {
                AMPLITUDE_ERROR(@"ERROR: Can't remove corrupt file %@: %@", path, error);
            }
        }
    } else {
        AMPLITUDE_LOG(@"WARNING: user is using a version of iOS that is older than 9.0, skipping unarchiving of file: %@", path);
    }
    return nil;
}

- (BOOL)archive:(id) obj toFile:(NSString*)path {
    return [NSKeyedArchiver archiveRootObject:obj toFile:path];
}

- (BOOL)moveFileIfNotExists:(NSString*)from to:(NSString*)to
{
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSError *error;
    if (![fileManager fileExistsAtPath:to] &&
        [fileManager fileExistsAtPath:from]) {
        if ([fileManager copyItemAtPath:from toPath:to error:&error]) {
            AMPLITUDE_LOG(@"INFO: copied %@ to %@", from, to);
            [fileManager removeItemAtPath:from error:NULL];
        } else {
            AMPLITUDE_LOG(@"WARN: Copy from %@ to %@ failed: %@", from, to, error);
            return NO;
        }
    }
    return YES;
}

#pragma clang diagnostic pop
@end
