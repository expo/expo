//
//  Branch_SDK.m
//  Branch-SDK
//
//  Created by Alex Austin on 6/5/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#import "Branch.h"
#import "BNCContentDiscoveryManager.h"
#import "BNCCrashlyticsWrapper.h"
#import "BNCDeepLinkViewControllerInstance.h"
#import "BNCEncodingUtils.h"
#import "BNCLinkData.h"
#import "BNCNetworkService.h"
#import "BNCPreferenceHelper.h"
#import "BNCServerRequest.h"
#import "BNCServerRequestQueue.h"
#import "BNCServerResponse.h"
#import "BNCStrongMatchHelper.h"
#import "BNCSystemObserver.h"
#import "BranchCloseRequest.h"
#import "BranchConstants.h"
#import "BranchContentDiscoverer.h"
#import "BranchCreditHistoryRequest.h"
#import "BranchInstallRequest.h"
#import "BranchLoadRewardsRequest.h"
#import "BranchLogoutRequest.h"
#import "BranchOpenRequest.h"
#import "BranchRedeemRewardsRequest.h"
#import "BranchSetIdentityRequest.h"
#import "BranchShortUrlRequest.h"
#import "BranchShortUrlSyncRequest.h"
#import "BranchSpotlightUrlRequest.h"
#import "BranchUniversalObject.h"
#import "BranchUserCompletedActionRequest.h"
#import "NSMutableDictionary+Branch.h"
#import "NSString+Branch.h"
#import "Branch+Validator.h"
#import "BNCSpotlightService.h"
#import "BNCApplication.h"
#import "BNCURLBlackList.h"
#import "BNCUserAgentCollector.h"
#import "BNCDeviceInfo.h"
#import <stdatomic.h>

NSString * const BRANCH_FEATURE_TAG_SHARE = @"share";
NSString * const BRANCH_FEATURE_TAG_REFERRAL = @"referral";
NSString * const BRANCH_FEATURE_TAG_INVITE = @"invite";
NSString * const BRANCH_FEATURE_TAG_DEAL = @"deal";
NSString * const BRANCH_FEATURE_TAG_GIFT = @"gift";

NSString * const BRANCH_INIT_KEY_CHANNEL = @"~channel";
NSString * const BRANCH_INIT_KEY_FEATURE = @"~feature";
NSString * const BRANCH_INIT_KEY_TAGS = @"~tags";
NSString * const BRANCH_INIT_KEY_CAMPAIGN = @"~campaign";
NSString * const BRANCH_INIT_KEY_STAGE = @"~stage";
NSString * const BRANCH_INIT_KEY_CREATION_SOURCE = @"~creation_source";
NSString * const BRANCH_INIT_KEY_REFERRER = @"+referrer";
NSString * const BRANCH_INIT_KEY_PHONE_NUMBER = @"+phone_number";
NSString * const BRANCH_INIT_KEY_IS_FIRST_SESSION = @"+is_first_session";
NSString * const BRANCH_INIT_KEY_CLICKED_BRANCH_LINK = @"+clicked_branch_link";
static NSString * const BRANCH_PUSH_NOTIFICATION_PAYLOAD_KEY = @"branch";

NSString * const BNCCanonicalIdList = @"$canonical_identifier_list";
NSString * const BNCPurchaseAmount = @"$amount";
NSString * const BNCPurchaseCurrency = @"$currency";
NSString * const BNCRegisterViewEvent = @"View";
NSString * const BNCAddToWishlistEvent = @"Add to Wishlist";
NSString * const BNCAddToCartEvent = @"Add to Cart";
NSString * const BNCPurchaseInitiatedEvent = @"Purchase Started";
NSString * const BNCPurchasedEvent = @"Purchased";
NSString * const BNCShareInitiatedEvent = @"Share Started";
NSString * const BNCShareCompletedEvent = @"Share Completed";

static NSString * const BNCLogLevelKey = @"io.branch.sdk.BNCLogLevel";
NSString * const BNCSpotlightFeature = @"spotlight";

#ifndef CSSearchableItemActivityIdentifier
#define CSSearchableItemActivityIdentifier @"kCSSearchableItemActivityIdentifier"
#endif

static inline dispatch_time_t BNCDispatchTimeFromSeconds(NSTimeInterval seconds) {
    return dispatch_time(DISPATCH_TIME_NOW, seconds * NSEC_PER_SEC);
}

static inline void BNCAfterSecondsPerformBlock(NSTimeInterval seconds, dispatch_block_t block) {
    dispatch_after(BNCDispatchTimeFromSeconds(seconds), dispatch_get_main_queue(), block);
}

#pragma mark - Load Categories

void ForceCategoriesToLoad(void);
void ForceCategoriesToLoad(void) {
    BNCForceNSErrorCategoryToLoad();
    BNCForceNSStringCategoryToLoad();
    BNCForceNSMutableDictionaryCategoryToLoad();
    BNCForceBranchValidatorCategoryToLoad();
    BNCForceUIViewControllerCategoryToLoad();
}

#pragma mark - BranchLink

@implementation BranchLink

+ (BranchLink*) linkWithUniversalObject:(BranchUniversalObject*)universalObject
                             properties:(BranchLinkProperties*)linkProperties {
    BranchLink *link = [[BranchLink alloc] init];
    link.universalObject = universalObject;
    link.linkProperties = linkProperties;
    return link;
}

@end

#pragma mark - Branch

typedef NS_ENUM(NSInteger, BNCInitStatus) {
    BNCInitStatusUninitialized = 0,
    BNCInitStatusInitializing,
    BNCInitStatusInitialized
};

@interface Branch() <BranchDeepLinkingControllerCompletionDelegate> {
    NSInteger _networkCount;
    BNCURLBlackList *_userURLBlackList;
}

@property (strong, nonatomic) BNCServerInterface *serverInterface;
@property (strong, nonatomic) BNCServerRequestQueue *requestQueue;
@property (strong, nonatomic) dispatch_semaphore_t processing_sema;
@property (assign, atomic)    NSInteger networkCount;
@property (assign, nonatomic) NSInteger asyncRequestCount;
@property (assign, nonatomic) BNCInitStatus initializationStatus;
@property (assign, nonatomic) BOOL shouldCallSessionInitCallback;
@property (assign, nonatomic) BOOL shouldAutomaticallyDeepLink;
@property (strong, nonatomic) BNCLinkCache *linkCache;
@property (strong, nonatomic) BNCPreferenceHelper *preferenceHelper;
@property (strong, nonatomic) BNCContentDiscoveryManager *contentDiscoveryManager;
@property (strong, nonatomic) NSMutableDictionary *deepLinkControllers;
@property (weak,   nonatomic) UIViewController *deepLinkPresentingController;
@property (assign, nonatomic) BOOL useCookieBasedMatching;
@property (strong, nonatomic) NSDictionary *deepLinkDebugParams;
@property (assign, nonatomic) BOOL accountForFacebookSDK;
@property (strong, nonatomic) id FBSDKAppLinkUtility;
@property (assign, nonatomic) BOOL delayForAppleAds;
@property (strong, nonatomic) NSMutableArray *whiteListedSchemeList;
@property (strong, nonatomic) BNCURLBlackList *URLBlackList;
@end

@implementation Branch

#pragma mark - Public methods

#pragma mark - GetInstance methods

static NSURL* bnc_logURL = nil;

+ (void) openLog {
    // Initialize the log
    @synchronized (self) {
        if (bnc_logURL) {
            #if defined(BNCKeepLogfiles)
                BNCLogSetOutputToURLByteWrap(bnc_logURL, 102400);
            #else
                BNCLogSetOutputFunction(NULL);
            #endif
        } else {
            BNCLogInitialize();
            BNCLogSetDisplayLevel(BNCLogLevelAll);
            bnc_logURL = BNCURLForBranchDirectory();
            bnc_logURL = [[NSURL alloc] initWithString:@"Branch.log" relativeToURL:bnc_logURL];
            #if defined(BNCKeepLogfiles)
                BNCLogSetOutputToURLByteWrap(bnc_logURL, 102400);
            #else
                BNCLogSetOutputFunction(NULL);
                if (bnc_logURL)
                    [[NSFileManager defaultManager] removeItemAtURL:bnc_logURL error:nil];
            #endif
            BNCLogSetDisplayLevel(BNCLogLevelWarning);  // Default

            // Try loading from the Info.plist
            NSString *logLevelString = [[NSBundle mainBundle] infoDictionary][@"BranchLogLevel"];
            if ([logLevelString isKindOfClass:[NSString class]]) {
                BNCLogLevel logLevel = BNCLogLevelFromString(logLevelString);
                BNCLogSetDisplayLevel(logLevel);
            }

            // Try loading from user defaults
            NSNumber *logLevel = [[NSUserDefaults standardUserDefaults] objectForKey:BNCLogLevelKey];
            if ([logLevel isKindOfClass:[NSNumber class]]) {
                BNCLogSetDisplayLevel([logLevel integerValue]);
            }

            BNCLog(@"Branch version %@ started at %@.", BNC_SDK_VERSION, [NSDate date]);
        }
    }
}

+ (void) closeLog {
    BNCLogCloseLogFile();
}

void BranchClassInitializeLog(void);
void BranchClassInitializeLog(void) {
    [Branch openLog];
}

+ (void) load {
    static dispatch_once_t onceToken = 0;
    dispatch_once(&onceToken, ^{
        BNCLogSetClientInitializeFunction(BranchClassInitializeLog);
    });
}

+ (Branch *) getTestInstance {
    Branch.useTestBranchKey = YES;
    return Branch.getInstance;
}

+ (Branch *)getInstance {
    return [Branch getInstanceInternal:self.class.branchKey returnNilIfNoCurrentInstance:NO];
}

+ (Branch *)getInstance:(NSString *)branchKey {
    self.branchKey = branchKey;
    return [Branch getInstanceInternal:self.branchKey returnNilIfNoCurrentInstance:NO];
}

- (id)initWithInterface:(BNCServerInterface *)interface
                  queue:(BNCServerRequestQueue *)queue
                  cache:(BNCLinkCache *)cache
       preferenceHelper:(BNCPreferenceHelper *)preferenceHelper
                    key:(NSString *)key {

    self = [super init];
    if (!self) return self;

    // Initialize instance variables

    _serverInterface = interface;
    _serverInterface.preferenceHelper = preferenceHelper;
    _requestQueue = queue;
    _linkCache = cache;
    _preferenceHelper = preferenceHelper;

    _contentDiscoveryManager = [[BNCContentDiscoveryManager alloc] init];
    _initializationStatus = BNCInitStatusUninitialized;
    _shouldCallSessionInitCallback = YES;
    _processing_sema = dispatch_semaphore_create(1);
    _networkCount = 0;
    _asyncRequestCount = 0;
    _deepLinkControllers = [[NSMutableDictionary alloc] init];
    _whiteListedSchemeList = [[NSMutableArray alloc] init];
    _useCookieBasedMatching = YES;
    self.class.branchKey = key;
    self.URLBlackList = [BNCURLBlackList new];
    [BranchOpenRequest setWaitNeededForOpenResponseLock];

    // Register for notifications

    NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];
    [notificationCenter
        addObserver:self
        selector:@selector(applicationWillResignActive)
        name:UIApplicationWillResignActiveNotification
        object:nil];

    [notificationCenter
        addObserver:self
        selector:@selector(applicationDidBecomeActive)
        name:UIApplicationDidBecomeActiveNotification
        object:nil];

    return self;
}

static Class bnc_networkServiceClass = NULL;

+ (void)  setNetworkServiceClass:(Class)networkServiceClass {
    @synchronized ([Branch class]) {
        if (bnc_networkServiceClass) {
            BNCLogError(@"The Branch network service class is already set. It can be set only once.");
            return;
        }
        if (![networkServiceClass conformsToProtocol:@protocol(BNCNetworkServiceProtocol)]) {
            BNCLogError(@"Class '%@' doesn't conform to protocol '%@'.",
                NSStringFromClass(networkServiceClass),
                NSStringFromProtocol(@protocol(BNCNetworkServiceProtocol))
            );
            return;
        }
        bnc_networkServiceClass = networkServiceClass;
    }
}

+ (Class) networkServiceClass {
    @synchronized ([Branch class]) {
        if (!bnc_networkServiceClass) bnc_networkServiceClass = [BNCNetworkService class];
        return bnc_networkServiceClass;
    }
}

#pragma mark - BrachActivityItemProvider methods

+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params {
    return [[BranchActivityItemProvider alloc] initWithParams:params tags:nil feature:nil stage:nil campaign:nil alias:nil delegate:nil];
}

+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(NSString *)feature {
    return [[BranchActivityItemProvider alloc] initWithParams:params tags:nil feature:feature stage:nil campaign:nil alias:nil delegate:nil];
}

+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(NSString *)feature stage:(NSString *)stage {
    return [[BranchActivityItemProvider alloc] initWithParams:params tags:nil feature:feature stage:stage campaign:nil alias:nil delegate:nil];
}

+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(NSString *)feature stage:(NSString *)stage tags:(NSArray *)tags {
    return [[BranchActivityItemProvider alloc] initWithParams:params tags:tags feature:feature stage:stage campaign:nil alias:nil delegate:nil];
}

+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(NSString *)feature stage:(NSString *)stage campaign:(NSString *)campaign tags:(NSArray *)tags alias:(NSString *)alias {
    return [[BranchActivityItemProvider alloc] initWithParams:params tags:tags feature:feature stage:stage campaign:campaign alias:alias delegate:nil];
}

+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(NSString *)feature stage:(NSString *)stage tags:(NSArray *)tags alias:(NSString *)alias {
    return [[BranchActivityItemProvider alloc] initWithParams:params tags:tags feature:feature stage:stage campaign:nil alias:alias delegate:nil];
}

+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(NSString *)feature stage:(NSString *)stage tags:(NSArray *)tags alias:(NSString *)alias delegate:(id <BranchActivityItemProviderDelegate>)delegate {
    return [[BranchActivityItemProvider alloc] initWithParams:params tags:tags feature:feature stage:stage campaign:nil alias:alias delegate:delegate];
}


#pragma mark - Configuration methods

static BOOL bnc_useTestBranchKey = NO;
static NSString *bnc_branchKey = nil;
static BOOL bnc_enableFingerprintIDInCrashlyticsReports = YES;

+ (void) resetBranchKey {
    bnc_branchKey = nil;
}

+ (void) setUseTestBranchKey:(BOOL)useTestKey {
    @synchronized (self) {
        if (bnc_branchKey && !!useTestKey != !!bnc_useTestBranchKey) {
            BNCLogError(@"Can't switch the Branch key once it's in use.");
            return;
        }
        bnc_useTestBranchKey = useTestKey;
    }
}

+ (BOOL) useTestBranchKey {
    @synchronized (self) {
        return bnc_useTestBranchKey;
    }
}

+ (void)setBranchKey:(NSString *)branchKey {
    NSError *error;
    [self setBranchKey:branchKey error:&error];
    
    if (error) {
        BNCLogError(@"Branch init error: %@", error.localizedDescription);
    }
}

+ (void)setBranchKey:(NSString*)branchKey error:(NSError **)error {
    @synchronized (self) {
        if (bnc_branchKey) {
            if (branchKey &&
                [branchKey isKindOfClass:[NSString class]] &&
                [branchKey isEqualToString:bnc_branchKey]) {
                return;
            }
            
            NSString *errorMessage = [NSString stringWithFormat:@"Branch key can only be set once."];
            *error = [NSError branchErrorWithCode:BNCInitError localizedMessage:errorMessage];
            return;
        }
        
        if (![branchKey isKindOfClass:[NSString class]]) {
            NSString *typeName = (branchKey) ? NSStringFromClass(branchKey.class) : @"<nil>";
            
            NSString *errorMessage = [NSString stringWithFormat:@"Invalid Branch key of type '%@'.", typeName];
            *error = [NSError branchErrorWithCode:BNCInitError localizedMessage:errorMessage];
            return;
        }

        if ([branchKey hasPrefix:@"key_test"]) {
            bnc_useTestBranchKey = YES;
            BNCLogWarning(
                @"You are using your test app's Branch Key. "
                 "Remember to change it to live Branch Key for production deployment."
            );
        
        } else if ([branchKey hasPrefix:@"key_live"]) {
            bnc_useTestBranchKey = NO;
        
        } else {
            NSString *errorMessage = [NSString stringWithFormat:@"Invalid Branch key format. Did you add your Branch key to your Info.plist? Passed key is '%@'.", branchKey];
            *error = [NSError branchErrorWithCode:BNCInitError localizedMessage:errorMessage];
            return;
        }

        bnc_branchKey = branchKey;
    }
}

+ (NSString*) branchKey {
    @synchronized (self) {
        if (bnc_branchKey) return bnc_branchKey;
        
        NSDictionary *branchDictionary = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"branch_key"];
        NSString *branchKey = nil;
        if ([branchDictionary isKindOfClass:[NSString class]]) {
            branchKey = (NSString*) branchDictionary;
        } else
        if ([branchDictionary isKindOfClass:[NSDictionary class]]) {
            branchKey =
                (self.useTestBranchKey) ? branchDictionary[@"test"] : branchDictionary[@"live"];
        }

        self.branchKey = branchKey;
        if (!bnc_branchKey) {
            BNCLogError(@"Your Branch key is not set in your Info.plist file. See "
                "https://dev.branch.io/getting-started/sdk-integration-guide/guide/ios/#configure-xcode-project"
                " for configuration instructions.");
        }
        return bnc_branchKey;
    }
}

+ (BOOL) branchKeyIsSet {
    @synchronized (self) {
        return (bnc_branchKey.length) ? YES : NO;
    }
}

+ (void)setEnableFingerprintIDInCrashlyticsReports:(BOOL)enabled
{
    @synchronized(self) {
        bnc_enableFingerprintIDInCrashlyticsReports = enabled;
    }
}

+ (BOOL) enableFingerprintIDInCrashlyticsReports
{
    @synchronized (self) {
        return bnc_enableFingerprintIDInCrashlyticsReports;
    }
}

- (void)setDebug {
    self.preferenceHelper.isDebug = YES;
    if (BNCLogDisplayLevel() > BNCLogLevelDebug)
        BNCLogSetDisplayLevel(BNCLogLevelDebug);
}

- (void)validateSDKIntegration {
    [self validateSDKIntegrationCore];
}

- (void)resetUserSession {
    self.initializationStatus = BNCInitStatusUninitialized;
}

- (BOOL)isUserIdentified {
    return self.preferenceHelper.userIdentity != nil;
}

- (void)setNetworkTimeout:(NSTimeInterval)timeout {
    self.preferenceHelper.timeout = timeout;
}

- (void)setMaxRetries:(NSInteger)maxRetries {
    self.preferenceHelper.retryCount = maxRetries;
}

- (void)setRetryInterval:(NSTimeInterval)retryInterval {
    self.preferenceHelper.retryInterval = retryInterval;
}

- (void)disableCookieBasedMatching {
    self.useCookieBasedMatching = NO;
}

- (void)accountForFacebookSDKPreventingAppLaunch {
    self.accountForFacebookSDK = YES;
}

- (void)suppressWarningLogs {
    BNCLogSetDisplayLevel(BNCLogLevelError);
}

- (void)setRequestMetadataKey:(NSString *)key value:(NSObject *)value {
    [self.preferenceHelper setRequestMetadataKey:key value:value];
}

- (void)enableDelayedInit {
    self.preferenceHelper.shouldWaitForInit = YES;

    self.useCookieBasedMatching = NO; // Developers delaying init should implement their own SFSafariViewController
}

- (void)disableDelayedInit {
    self.preferenceHelper.shouldWaitForInit = NO;
}

- (NSURL *)getUrlForOnboardingWithRedirectUrl:(NSString *)redirectUrl {
    return [BNCStrongMatchHelper getUrlForCookieBasedMatchingWithBranchKey:self.class.branchKey redirectUrl:redirectUrl];
}

- (void)resumeInit {
    self.preferenceHelper.shouldWaitForInit = NO;
    if (self.initializationStatus == BNCInitStatusInitialized) {
        BNCLogError(@"User session has already been initialized, so resumeInit is aborting.");
    }
    else if (![self.requestQueue containsInstallOrOpen]) {
        BNCLogError(@"No install or open request, so resumeInit is aborting.");
    }
    else {
        [self processNextQueueItem];
    }
}

- (void)setInstallRequestDelay:(NSInteger)installRequestDelay {
    self.preferenceHelper.installRequestDelay = installRequestDelay;
}

+ (BOOL) trackingDisabled {
    @synchronized(self) {
        return [BNCPreferenceHelper preferenceHelper].trackingDisabled;
    }
}

+ (void) setTrackingDisabled:(BOOL)disabled {
    @synchronized(self) {
        BOOL currentSetting = self.trackingDisabled;
        if (!!currentSetting == !!disabled)
            return;
        if (disabled) {
            // Set the flag (which also clears the settings):
            [BNCPreferenceHelper preferenceHelper].trackingDisabled = YES;
            Branch *branch = Branch.getInstance;
            [branch clearNetworkQueue];
            branch.initializationStatus = BNCInitStatusUninitialized;
            [branch.linkCache clear];
            // Release the lock in case it's locked:
            [BranchOpenRequest releaseOpenResponseLock];
        } else {
            // Set the flag:
            [BNCPreferenceHelper preferenceHelper].trackingDisabled = NO;
            // Initialize a Branch session:
            [Branch.getInstance initUserSessionAndCallCallback:NO];
        }
    }
}

#pragma mark - InitSession Permutation methods

- (void)initSessionWithLaunchOptions:(NSDictionary *)options {
    [self initSessionWithLaunchOptions:options
                          isReferrable:YES
         explicitlyRequestedReferrable:NO
        automaticallyDisplayController:NO
               registerDeepLinkHandler:nil];
}

- (void)initSessionWithLaunchOptions:(NSDictionary *)options andRegisterDeepLinkHandler:(callbackWithParams)callback {
    [self initSessionWithLaunchOptions:options isReferrable:YES explicitlyRequestedReferrable:NO automaticallyDisplayController:NO registerDeepLinkHandler:callback];
}

- (void)initSessionWithLaunchOptions:(NSDictionary *)options andRegisterDeepLinkHandlerUsingBranchUniversalObject:(callbackWithBranchUniversalObject)callback {
    [self initSessionWithLaunchOptions:options isReferrable:YES explicitlyRequestedReferrable:NO automaticallyDisplayController:NO registerDeepLinkHandlerUsingBranchUniversalObject:callback];
}

- (void)initSessionWithLaunchOptions:(NSDictionary *)options isReferrable:(BOOL)isReferrable {
    [self initSessionWithLaunchOptions:options isReferrable:isReferrable explicitlyRequestedReferrable:YES automaticallyDisplayController:NO registerDeepLinkHandler:nil];
}

- (void)initSessionWithLaunchOptions:(NSDictionary *)options automaticallyDisplayDeepLinkController:(BOOL)automaticallyDisplayController {
    [self initSessionWithLaunchOptions:options isReferrable:YES explicitlyRequestedReferrable:NO automaticallyDisplayController:automaticallyDisplayController registerDeepLinkHandler:nil];
}

- (void)initSessionWithLaunchOptions:(NSDictionary *)options isReferrable:(BOOL)isReferrable andRegisterDeepLinkHandler:(callbackWithParams)callback {
    [self initSessionWithLaunchOptions:options isReferrable:isReferrable explicitlyRequestedReferrable:YES automaticallyDisplayController:NO registerDeepLinkHandler:callback];
}

- (void)initSessionWithLaunchOptions:(NSDictionary *)options automaticallyDisplayDeepLinkController:(BOOL)automaticallyDisplayController deepLinkHandler:(callbackWithParams)callback {
    [self initSessionWithLaunchOptions:options isReferrable:YES explicitlyRequestedReferrable:NO automaticallyDisplayController:automaticallyDisplayController registerDeepLinkHandler:callback];
}

- (void)initSessionWithLaunchOptions:(NSDictionary *)options isReferrable:(BOOL)isReferrable automaticallyDisplayDeepLinkController:(BOOL)automaticallyDisplayController {
    [self initSessionWithLaunchOptions:options isReferrable:isReferrable explicitlyRequestedReferrable:YES automaticallyDisplayController:automaticallyDisplayController registerDeepLinkHandler:nil];
}

- (void)initSessionWithLaunchOptions:(NSDictionary *)options automaticallyDisplayDeepLinkController:(BOOL)automaticallyDisplayController isReferrable:(BOOL)isReferrable deepLinkHandler:(callbackWithParams)callback {
    [self initSessionWithLaunchOptions:options isReferrable:isReferrable explicitlyRequestedReferrable:YES automaticallyDisplayController:automaticallyDisplayController registerDeepLinkHandler:callback];
}


#pragma mark - Actual Init Session

- (void)initSessionWithLaunchOptions:(NSDictionary *)options isReferrable:(BOOL)isReferrable explicitlyRequestedReferrable:(BOOL)explicitlyRequestedReferrable automaticallyDisplayController:(BOOL)automaticallyDisplayController registerDeepLinkHandlerUsingBranchUniversalObject:(callbackWithBranchUniversalObject)callback {
    self.sessionInitWithBranchUniversalObjectCallback = callback;
    [self initSessionWithLaunchOptions:options isReferrable:isReferrable explicitlyRequestedReferrable:explicitlyRequestedReferrable automaticallyDisplayController:automaticallyDisplayController];
}

- (void)initSessionWithLaunchOptions:(NSDictionary *)options isReferrable:(BOOL)isReferrable explicitlyRequestedReferrable:(BOOL)explicitlyRequestedReferrable automaticallyDisplayController:(BOOL)automaticallyDisplayController registerDeepLinkHandler:(callbackWithParams)callback {
    self.sessionInitWithParamsCallback = callback;
    [self initSessionWithLaunchOptions:options isReferrable:isReferrable explicitlyRequestedReferrable:explicitlyRequestedReferrable automaticallyDisplayController:automaticallyDisplayController];
}


- (void)initSessionWithLaunchOptions:(NSDictionary *)options
                        isReferrable:(BOOL)isReferrable
       explicitlyRequestedReferrable:(BOOL)explicitlyRequestedReferrable
      automaticallyDisplayController:(BOOL)automaticallyDisplayController {
    // Log this early. Not consistently showing up when logged from [Branch initialize].
    [self.class addBranchSDKVersionToCrashlyticsReport];

    self.shouldAutomaticallyDeepLink = automaticallyDisplayController;

    // If the SDK is already initialized, this means that initSession is being called later in the app lifecycle
    // and that the developer is expecting to receive deep link parameters via the callback block immediately
    if (self.initializationStatus == BNCInitStatusInitialized) {
        [self initUserSessionAndCallCallback:YES];
    }

    // The rest of this function assumes that initSession is being called BEFORE continueUserActivity and openUrl
    // in the application life cycle, and that the SDK is not yet initialized.

    // Handle push notification on app launch
    if ([options objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey]) {
        id branchUrlFromPush =
            [options objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey][BRANCH_PUSH_NOTIFICATION_PAYLOAD_KEY];
        if ([branchUrlFromPush isKindOfClass:[NSString class]]) {
            self.preferenceHelper.universalLinkUrl = branchUrlFromPush;
            self.preferenceHelper.referringURL = branchUrlFromPush;
        }
    }

    if ([BNCSystemObserver getOSVersion].integerValue >= 8) {

        // Handle case where there's no URI scheme or Universal Link
        if (![options.allKeys containsObject:UIApplicationLaunchOptionsURLKey] &&
            ![options.allKeys containsObject:UIApplicationLaunchOptionsUserActivityDictionaryKey]) {

            self.asyncRequestCount = 0;

            // These methods will increment self.asyncRequestCount if they make an async call:
            
            // load user agent
            [self loadUserAgent];
            // If Facebook SDK is present, call deferred app link check here which will later on call initUserSession
            [self checkFacebookAppLinks];
            // If developer opted in, call deferred apple search attribution API here which will later on call initUserSession
            [self checkAppleSearchAdsAttribution];

            if (self.asyncRequestCount == 0) {
                // If we're not looking for App Links or Apple Search Ads, initialize
                [self initUserSessionAndCallCallback:YES];
            }
        }
        // Handle case where there is Universal Link present
        else if ([options.allKeys containsObject:UIApplicationLaunchOptionsUserActivityDictionaryKey]) {
            // Optional flag for the developer if they're letting Facebook return the boolean on didFinishLaunchingWithOptions
            // Note that this is no longer a recommended path, and that we tell developers to just return YES
            if (self.accountForFacebookSDK) {
                // does not work in Swift, because Objective-C to Swift interop is bad
                id activity =
                    [[options objectForKey:UIApplicationLaunchOptionsUserActivityDictionaryKey]
                        objectForKey:@"UIApplicationLaunchOptionsUserActivityKey"];
                if (activity && [activity isKindOfClass:[NSUserActivity class]]) {
                    [self continueUserActivity:activity];
                    return;
                }
            }
            // Wait for continueUserActivity Branch AppDelegate call to come through
            self.preferenceHelper.shouldWaitForInit = YES;
        }
    }
    else if (![options.allKeys containsObject:UIApplicationLaunchOptionsURLKey]) {
        [self initUserSessionAndCallCallback:YES];
    }
}



//these params will be added
- (void) setDeepLinkDebugMode:(NSDictionary *)debugParams {
    self.deepLinkDebugParams = debugParams;
}

-(void)setWhiteListedSchemes:(NSArray *)schemes {
    self.whiteListedSchemeList = [schemes mutableCopy];
}

-(void)addWhiteListedScheme:(NSString *)scheme {
    [self.whiteListedSchemeList addObject:scheme];
}

- (void) setBlackListURLRegex:(NSArray<NSString*>*)blackListURLs {
    @synchronized (self) {
        _userURLBlackList = [[BNCURLBlackList alloc] init];
        _userURLBlackList.blackList = blackListURLs;
    }
}

- (NSArray<NSString*>*) blackListURLRegex {
    @synchronized (self) {
        return _userURLBlackList.blackList;
    }
}

- (BOOL)handleDeepLink:(NSURL *)url {
    return [self handleDeepLink:url fromSelf:YES];
}

-(BOOL)handleDeepLinkWithNewSession:(NSURL *)url{
    return [self handleDeepLink:url fromSelf:YES];
}

- (BOOL)handleDeepLink:(NSURL *)url fromSelf:(BOOL)isFromSelf {
    NSString *blackListPattern = nil;
    blackListPattern = [self.URLBlackList blackListPatternMatchingURL:url];
    if (!blackListPattern) {
        blackListPattern = [_userURLBlackList blackListPatternMatchingURL:url];
    }
    if (blackListPattern) {
        self.preferenceHelper.blacklistURLOpen = YES;
        self.preferenceHelper.externalIntentURI = blackListPattern;
        self.preferenceHelper.referringURL = blackListPattern;
        if (isFromSelf) [self resetUserSession];
        [self initUserSessionAndCallCallback:(self.initializationStatus != BNCInitStatusInitialized)];
        return NO;
    }

    NSString *scheme = [url scheme];
    if ([scheme isEqualToString:@"http"] || [scheme isEqualToString:@"https"]) {
        return [self handleUniversalDeepLink_private:url.absoluteString fromSelf:isFromSelf];
    } else {
        return [self handleSchemeDeepLink_private:url fromSelf:isFromSelf];
    }
}

- (BOOL)handleSchemeDeepLink_private:(NSURL*)url fromSelf:(BOOL)isFromSelf {
    if (isFromSelf) {
        [self resetUserSession];
    }
    
    BOOL handled = NO;
    self.preferenceHelper.referringURL = nil;
    if (url && ![url isEqual:[NSNull null]]) {

        NSString *urlScheme = [url scheme];

        // save the incoming url in the preferenceHelper in the externalIntentURI field
        if ([self.whiteListedSchemeList count]) {
            for (NSString *scheme in self.whiteListedSchemeList) {
                if (urlScheme && [scheme isEqualToString:urlScheme]) {
                    self.preferenceHelper.externalIntentURI = [url absoluteString];
                    self.preferenceHelper.referringURL = [url absoluteString];
                    break;
                }
            }
        } else {
            self.preferenceHelper.externalIntentURI = [url absoluteString];
            self.preferenceHelper.referringURL = [url absoluteString];
        }

        NSString *query = [url fragment];
        if (!query) {
            query = [url query];
        }

        NSDictionary *params = [BNCEncodingUtils decodeQueryStringToDictionary:query];
        if (params[@"link_click_id"]) {
            handled = YES;
            self.preferenceHelper.linkClickIdentifier = params[@"link_click_id"];
        }
    }
    [self initUserSessionAndCallCallback:YES];
    return handled;
}


- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation {

    BOOL fromSelf = NO;
    NSString *bundleID = [[NSBundle mainBundle] bundleIdentifier];
    if (bundleID && sourceApplication) {
        fromSelf = [bundleID isEqualToString:sourceApplication];
    }
    if (!fromSelf) [self resetUserSession];
    return [self handleDeepLink:url fromSelf:fromSelf];
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary</*UIApplicationOpenURLOptionsKey*/NSString*,id> *)options {

    NSString *source = nil;
    NSString *annotation = nil;
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wpartial-availability"
    if (UIApplicationOpenURLOptionsSourceApplicationKey &&
        UIApplicationOpenURLOptionsAnnotationKey) {
        source = options[UIApplicationOpenURLOptionsSourceApplicationKey];
        annotation = options[UIApplicationOpenURLOptionsAnnotationKey];
    }
    #pragma clang diagnostic pop
    return [self application:application openURL:url sourceApplication:source annotation:annotation];
}

- (BOOL)handleUniversalDeepLink_private:(NSString*)urlString fromSelf:(BOOL)isFromSelf {
    if (isFromSelf) {
        [self resetUserSession];
    }

    if (urlString.length) {
        self.preferenceHelper.universalLinkUrl = urlString;
        self.preferenceHelper.referringURL = urlString;
    }
    self.preferenceHelper.shouldWaitForInit = NO;
    [self initUserSessionAndCallCallback:YES];

    id branchUniversalLinkDomains = [self.preferenceHelper getBranchUniversalLinkDomains];
    if ([branchUniversalLinkDomains isKindOfClass:[NSString class]] &&
        [urlString bnc_containsString:branchUniversalLinkDomains]) {
        return YES;
    }
    else if ([branchUniversalLinkDomains isKindOfClass:[NSArray class]]) {
        for (id oneDomain in branchUniversalLinkDomains) {
            if ([oneDomain isKindOfClass:[NSString class]] && [urlString bnc_containsString:oneDomain]) {
                return YES;
            }
        }
    }

    NSString *userActivityURL = urlString;
    NSArray *branchDomains = [NSArray arrayWithObjects:@"bnc.lt", @"app.link", @"test-app.link", nil];
    for (NSString* domain in branchDomains) {
        if ([userActivityURL bnc_containsString:domain])
            return YES;
    }

    return NO;
}

- (BOOL)continueUserActivity:(NSUserActivity *)userActivity {
    BNCLogDebugSDK(@"continueUserActivity:");

    // Check to see if a browser activity needs to be handled
    if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
        // If we're already in-progress cancel the last open and do this one.
        [self removeInstallOrOpen];
        return [self handleDeepLink:userActivity.webpageURL fromSelf:YES];
    }

    // Check to see if a spotlight activity needs to be handled
    NSString *spotlightIdentifier =
        [self.contentDiscoveryManager spotlightIdentifierFromActivity:userActivity];
    NSURL *webURL = userActivity.webpageURL;


    if ([self isBranchLink:userActivity.userInfo[CSSearchableItemActivityIdentifier]]) {
        return [self handleDeepLinkWithNewSession:[NSURL URLWithString:userActivity.userInfo[CSSearchableItemActivityIdentifier]]];
    }
    else if (webURL != nil && [self isBranchLink:[webURL absoluteString]]) {
        return [self handleDeepLinkWithNewSession:webURL];
    }
    else if (spotlightIdentifier) {
        self.preferenceHelper.spotlightIdentifier = spotlightIdentifier;
    }
    else {
        NSString *nonBranchSpotlightIdentifier =
        [self.contentDiscoveryManager standardSpotlightIdentifierFromActivity:userActivity];
        if (nonBranchSpotlightIdentifier) {
            self.preferenceHelper.spotlightIdentifier = nonBranchSpotlightIdentifier;
        }
    }
    self.preferenceHelper.shouldWaitForInit = NO;
    [self initUserSessionAndCallCallback:YES];

    return spotlightIdentifier != nil;
}

- (BOOL)isBranchLink: (NSString*)urlString {
    id branchUniversalLinkDomains = [self.preferenceHelper getBranchUniversalLinkDomains];
    if ([branchUniversalLinkDomains isKindOfClass:[NSString class]] &&
        [urlString containsString:branchUniversalLinkDomains]) {
        return YES;
    }
    else if ([branchUniversalLinkDomains isKindOfClass:[NSArray class]]) {
        for (id oneDomain in branchUniversalLinkDomains) {
            if ([oneDomain isKindOfClass:[NSString class]] && [urlString containsString:oneDomain]) {
                return YES;
            }
        }
    }

    NSString *userActivityURL = urlString;
    NSArray *branchDomains = [NSArray arrayWithObjects:@"bnc.lt", @"app.link", @"test-app.link", nil];
    for (NSString* domain in branchDomains) {
        if ([userActivityURL containsString:domain])
            return YES;
    }
    return NO;
}

#pragma mark - Push Notification support

- (void)handlePushNotification:(NSDictionary *)userInfo {
    // look for a branch shortlink in the payload (shortlink because iOS7 only supports 256 bytes)
    NSString *urlStr = [userInfo objectForKey:BRANCH_PUSH_NOTIFICATION_PAYLOAD_KEY];
    if (urlStr.length) {
        // reusing this field, so as not to create yet another url slot on prefshelper
        self.preferenceHelper.universalLinkUrl = urlStr;
        self.preferenceHelper.referringURL = urlStr;
    }

    // If app is active, then close out the session and start a new one.
    // Else the URL will be handled by `applicationDidBecomeActive`.

    Class UIApplicationClass = NSClassFromString(@"UIApplication");
    if (urlStr && [[UIApplicationClass sharedApplication] applicationState] == UIApplicationStateActive) {
        NSURL *url = [NSURL URLWithString:urlStr];
        if (url) [self handleDeepLink:url fromSelf:YES];
    }
}

- (void)loadUserAgent {
    self.asyncRequestCount++;
    [[BNCUserAgentCollector instance] loadUserAgentForSystemBuildVersion:[BNCDeviceInfo systemBuildVersion] withCompletion:^(NSString * _Nullable userAgent) {
        self.asyncRequestCount--;
        // If there's another async attribution check in flight, don't continue with init:
        if (self.asyncRequestCount > 0) return;
        
        self.preferenceHelper.shouldWaitForInit = NO;
        dispatch_async(dispatch_get_main_queue(), ^{
            [self initUserSessionAndCallCallback:(self.initializationStatus != BNCInitStatusInitialized)];
        });
    }];
}

#pragma mark - Apple Search Ad Check

- (void)delayInitToCheckForSearchAds {
    self.delayForAppleAds = YES;
}

- (BOOL)checkAppleSearchAdsAttribution {
    if (!self.delayForAppleAds)
        return NO;

    NSNumber *hasAppleSearchAdAttribution = self.preferenceHelper.appleSearchAdDetails[@"iad-attribution"];
    if ([hasAppleSearchAdAttribution boolValue])
        return NO;

    NSDate *installDatePlus30 =
        [[BNCApplication currentApplication].currentInstallDate
            dateByAddingTimeInterval:(30.0*24.0*60.0*60.0)];
    if ([installDatePlus30 compare:[NSDate date]] < 0) {
        return NO;
    }

    Class ADClientClass = NSClassFromString(@"ADClient");
    SEL sharedClient = NSSelectorFromString(@"sharedClient");
    SEL requestAttribution = NSSelectorFromString(@"requestAttributionDetailsWithBlock:");

    BOOL ADClientIsAvailable =
        ADClientClass &&
        [ADClientClass instancesRespondToSelector:requestAttribution] &&
        [ADClientClass methodForSelector:sharedClient];

    if (!ADClientIsAvailable) {
        BNCLogWarning(@"`delayForAppleAds` is true but ADClient is not available. Is the iAD.framework included and iOS 10?");
        return NO;
    }

    id sharedClientInstance = ((id (*)(id, SEL))[ADClientClass methodForSelector:sharedClient])(ADClientClass, sharedClient);

    self.preferenceHelper.shouldWaitForInit = YES;
    self.preferenceHelper.checkedAppleSearchAdAttribution = YES;
    self.asyncRequestCount++;

    NSDate *startDate = [NSDate date];
    _Atomic __block BOOL hasBeenCalled = NO;
    void (^__nullable completionBlock)(NSDictionary *attrDetails, NSError *error) =
      ^ void(NSDictionary *__nullable attrDetails, NSError *__nullable error) {
        @synchronized(self) {
            NSTimeInterval elapsedSeconds = - [startDate timeIntervalSinceNow];
            BNCLogDebugSDK(@"Elapsed Apple Search Ad callback time: %1.3fs.", elapsedSeconds);

            if (attrDetails.count > 0 && !error) {
                [self.preferenceHelper addInstrumentationDictionaryKey:@"apple_search_ad"
                    value:[[NSNumber numberWithInteger:elapsedSeconds*1000] stringValue]];
            }
            if (!error) {
                if (attrDetails == nil)
                    attrDetails = @{};
                if (self.preferenceHelper.appleSearchAdDetails == nil)
                    self.preferenceHelper.appleSearchAdDetails = @{};
                if (![self.preferenceHelper.appleSearchAdDetails isEqualToDictionary:attrDetails]) {
                    self.preferenceHelper.appleSearchAdDetails = attrDetails;
                    self.preferenceHelper.appleSearchAdNeedsSend = YES;
                }
            }
            // Only continue with initialization once:
            BOOL localHasBeenCalled = atomic_exchange(&hasBeenCalled, YES);
            if (localHasBeenCalled) return;

            if (error) {
                BNCLogError(@"Error while getting Apple Search Ad attribution: %@.", error);
            }

            self.asyncRequestCount--;
            // If there's another async attribution check in flight, don't continue with init:
            if (self.asyncRequestCount > 0) return;

            self.preferenceHelper.shouldWaitForInit = NO;
            dispatch_async(dispatch_get_main_queue(), ^{
                [self initUserSessionAndCallCallback:(self.initializationStatus != BNCInitStatusInitialized)];
            });
        }
    };

    // Set a expiration timer in case we don't get a call back (I'm looking at you, iPad):
    // This may be a temporary quick fix until we figure out a better wat to do search ads.
    BNCAfterSecondsPerformBlock(10.0, ^ {
        completionBlock(nil, [NSError errorWithDomain:NSNetServicesErrorDomain code:NSNetServicesTimeoutError userInfo:nil]);
    });

    ((void (*)(id, SEL, void (^ __nullable)(NSDictionary *__nullable attrDetails, NSError * __nullable error)))
        [sharedClientInstance methodForSelector:requestAttribution])
            (sharedClientInstance, requestAttribution, completionBlock);

    return YES;
}

#pragma mark - Facebook App Link Check

- (void)registerFacebookDeepLinkingClass:(id)FBSDKAppLinkUtility {
    self.FBSDKAppLinkUtility = FBSDKAppLinkUtility;
}

- (BOOL)checkFacebookAppLinks {
    if (self.FBSDKAppLinkUtility) {

        SEL fetchDeferredAppLink = NSSelectorFromString(@"fetchDeferredAppLink:");

        if ([self.FBSDKAppLinkUtility methodForSelector:fetchDeferredAppLink]) {
            void (^__nullable completionBlock)(NSURL *appLink, NSError *error) = ^void(NSURL *__nullable appLink, NSError *__nullable error) {
                self.asyncRequestCount--;

                // if there's another async attribution check in flight, don't continue with init
                if (self.asyncRequestCount > 0) { return; }

                self.preferenceHelper.shouldWaitForInit = NO;

                [self handleDeepLink:appLink];
            };

            self.asyncRequestCount++;
            self.preferenceHelper.checkedFacebookAppLinks = YES;
            self.preferenceHelper.shouldWaitForInit = YES;

            ((void (*)(id, SEL, void (^ __nullable)(NSURL *__nullable appLink, NSError * __nullable error)))[self.FBSDKAppLinkUtility methodForSelector:fetchDeferredAppLink])(self.FBSDKAppLinkUtility, fetchDeferredAppLink, completionBlock);

            return YES;
        }
    }

    return NO;
}

#pragma mark - Deep Link Controller methods

- (void)registerDeepLinkController:(UIViewController <BranchDeepLinkingController> *)controller forKey:(NSString *)key {
    self.deepLinkControllers[key] = controller;
}

- (void)registerDeepLinkController:(UIViewController <BranchDeepLinkingController> *)controller forKey:(NSString *)key withPresentation:(BNCViewControllerPresentationOption)option{

    BNCDeepLinkViewControllerInstance* deepLinkModal = [[BNCDeepLinkViewControllerInstance alloc] init];

    deepLinkModal.viewController = controller;
    deepLinkModal.option         = option;

    self.deepLinkControllers[key] = deepLinkModal;
}


#pragma mark - Identity methods

- (void)setIdentity:(NSString *)userId {
    [self setIdentity:userId withCallback:NULL];
}

- (void)setIdentity:(NSString *)userId withCallback:(callbackWithParams)callback {
    if (!userId || [self.preferenceHelper.userIdentity isEqualToString:userId]) {
        if (callback) {
            callback([self getFirstReferringParams], nil);
        }
        return;
    }
    [self initSessionIfNeededAndNotInProgress];
    BranchSetIdentityRequest *req = [[BranchSetIdentityRequest alloc] initWithUserId:userId callback:callback];
    [self.requestQueue enqueue:req];
    [self processNextQueueItem];
}

- (void)logout {
    [self logoutWithCallback:nil];
}


- (void)logoutWithCallback:(callbackWithStatus)callback {
    if (self.initializationStatus == BNCInitStatusUninitialized) {
        NSError *error =
            (Branch.trackingDisabled)
            ? [NSError branchErrorWithCode:BNCTrackingDisabledError]
            : [NSError branchErrorWithCode:BNCInitError];
        BNCLogError(@"Branch is not initialized, cannot logout.");
        if (callback) {callback(NO, error);}
        return;
    }

    BranchLogoutRequest *req =
        [[BranchLogoutRequest alloc] initWithCallback:^(BOOL success, NSError *error) {
            if (success) {
                // Clear cached links
                self.linkCache = [[BNCLinkCache alloc] init];

                if (callback) {
                    callback(YES, nil);
                }
                BNCLogDebug(@"Logout success.");
            } else /*failure*/ {
                if (callback) {
                    callback(NO, error);
                }
                BNCLogDebug(@"Logout failure.");
            }
        }];

    [self.requestQueue enqueue:req];
    [self processNextQueueItem];
}



#pragma mark - User Action methods

- (void)userCompletedAction:(NSString *)action {
    [self userCompletedAction:action withState:nil];
}

- (void)userCompletedAction:(NSString *)action withState:(NSDictionary *)state {
    if (!action) {
        return;
    }

    [self initSessionIfNeededAndNotInProgress];

    BranchUserCompletedActionRequest *req = [[BranchUserCompletedActionRequest alloc] initWithAction:action state:state];
    [self.requestQueue enqueue:req];
    [self processNextQueueItem];
}

- (void)userCompletedAction:(NSString *)action withState:(NSDictionary *)state withDelegate:(id)branchViewCallback {
    [self userCompletedAction:action withState:state];
}

- (void) sendServerRequest:(BNCServerRequest*)request {
    [self initSessionIfNeededAndNotInProgress];
    [self.requestQueue enqueue:request];
    [self processNextQueueItem];
}

- (void) sendServerRequestWithoutSession:(BNCServerRequest*)request {
    [self.requestQueue enqueue:request];
    [self processNextQueueItem];
}

- (void) sendCommerceEvent:(BNCCommerceEvent *)commerceEvent
				  metadata:(NSDictionary*)metadata
			withCompletion:(void (^)(NSDictionary *, NSError *))completion {

    [self initSessionIfNeededAndNotInProgress];
    BranchCommerceEventRequest *request =
		[[BranchCommerceEventRequest alloc]
			initWithCommerceEvent:commerceEvent
			metadata:metadata
			completion:completion];
    [self.requestQueue enqueue:request];
    [self processNextQueueItem];
}

#pragma mark - Credit methods

- (void)loadRewardsWithCallback:(callbackWithStatus)callback {
    [self initSessionIfNeededAndNotInProgress];

    BranchLoadRewardsRequest *req = [[BranchLoadRewardsRequest alloc] initWithCallback:callback];
    [self.requestQueue enqueue:req];
    [self processNextQueueItem];
}

- (NSInteger)getCredits {
    return [self.preferenceHelper getCreditCount];
}

- (void)redeemRewards:(NSInteger)count {
    [self redeemRewards:count forBucket:@"default" callback:NULL];
}

- (void)redeemRewards:(NSInteger)count callback:(callbackWithStatus)callback {
    [self redeemRewards:count forBucket:@"default" callback:callback];
}

- (NSInteger)getCreditsForBucket:(NSString *)bucket {
    return [self.preferenceHelper getCreditCountForBucket:bucket];
}

- (void)redeemRewards:(NSInteger)count forBucket:(NSString *)bucket {
    [self redeemRewards:count forBucket:bucket callback:NULL];
}

- (void)redeemRewards:(NSInteger)count forBucket:(NSString *)bucket callback:(callbackWithStatus)callback {
    if (count == 0) {
        if (callback) {
            callback(false, [NSError branchErrorWithCode:BNCRedeemZeroCreditsError]);
        }
        else {
            BNCLogWarning(@"Cannot redeem zero credits.");
        }
        return;
    }

    NSInteger totalAvailableCredits = [self.preferenceHelper getCreditCountForBucket:bucket];
    if (count > totalAvailableCredits) {
        if (callback) {
            callback(false, [NSError branchErrorWithCode:BNCRedeemCreditsError]);
        }
        else {
            BNCLogWarning(@"You're trying to redeem more credits than are available. Have you loaded rewards?");
        }
        return;
    }

    [self initSessionIfNeededAndNotInProgress];

    BranchRedeemRewardsRequest *req = [[BranchRedeemRewardsRequest alloc] initWithAmount:count bucket:bucket callback:callback];
    [self.requestQueue enqueue:req];
    [self processNextQueueItem];
}

- (void)getCreditHistoryWithCallback:(callbackWithList)callback {
    [self getCreditHistoryForBucket:nil after:nil number:100 order:BranchMostRecentFirst andCallback:callback];
}

- (void)getCreditHistoryForBucket:(NSString *)bucket andCallback:(callbackWithList)callback {
    [self getCreditHistoryForBucket:bucket after:nil number:100 order:BranchMostRecentFirst andCallback:callback];
}

- (void)getCreditHistoryAfter:(NSString *)creditTransactionId number:(NSInteger)length order:(BranchCreditHistoryOrder)order andCallback:(callbackWithList)callback {
    [self getCreditHistoryForBucket:nil after:creditTransactionId number:length order:order andCallback:callback];
}

- (void)getCreditHistoryForBucket:(NSString *)bucket after:(NSString *)creditTransactionId number:(NSInteger)length order:(BranchCreditHistoryOrder)order andCallback:(callbackWithList)callback {
    [self initSessionIfNeededAndNotInProgress];

    BranchCreditHistoryRequest *req = [[BranchCreditHistoryRequest alloc] initWithBucket:bucket creditTransactionId:creditTransactionId length:length order:order callback:callback];
    [self.requestQueue enqueue:req];
    [self processNextQueueItem];
}

- (BranchUniversalObject *)getFirstReferringBranchUniversalObject {
    NSDictionary *params = [self getFirstReferringParams];
    if ([[params objectForKey:BRANCH_INIT_KEY_CLICKED_BRANCH_LINK] isEqual:@1]) {
        return [BranchUniversalObject objectWithDictionary:params];
    }
    return nil;
}

- (BranchLinkProperties *)getFirstReferringBranchLinkProperties {
    NSDictionary *params = [self getFirstReferringParams];
    if ([[params objectForKey:BRANCH_INIT_KEY_CLICKED_BRANCH_LINK] isEqual:@1]) {
        return [BranchLinkProperties getBranchLinkPropertiesFromDictionary:params];
    }
    return nil;
}

- (NSDictionary *)getFirstReferringParams {
    NSDictionary *origInstallParams = [BNCEncodingUtils decodeJsonStringToDictionary:self.preferenceHelper.installParams];

    if (self.deepLinkDebugParams) {
        NSMutableDictionary* debugInstallParams =
			[[BNCEncodingUtils decodeJsonStringToDictionary:self.preferenceHelper.sessionParams]
				mutableCopy];
        [debugInstallParams addEntriesFromDictionary:self.deepLinkDebugParams];
        return debugInstallParams;
    }
    return origInstallParams;
}

- (NSDictionary *)getLatestReferringParams {
    NSDictionary *origSessionParams = [BNCEncodingUtils decodeJsonStringToDictionary:self.preferenceHelper.sessionParams];

    if (self.deepLinkDebugParams) {
        NSMutableDictionary* debugSessionParams = [origSessionParams mutableCopy];
        [debugSessionParams addEntriesFromDictionary:self.deepLinkDebugParams];
        return debugSessionParams;
    }
    return origSessionParams;
}

- (NSDictionary*) getLatestReferringParamsSynchronous {
    [BranchOpenRequest waitForOpenResponseLock];
    NSDictionary *result = [self getLatestReferringParams];
    [BranchOpenRequest releaseOpenResponseLock];
    return result;
}

- (BranchUniversalObject *)getLatestReferringBranchUniversalObject {
    NSDictionary *params = [self getLatestReferringParams];
    if ([[params objectForKey:BRANCH_INIT_KEY_CLICKED_BRANCH_LINK] isEqual:@1]) {
        return [BranchUniversalObject objectWithDictionary:params];
    }
    return nil;
}

- (BranchLinkProperties *)getLatestReferringBranchLinkProperties {
    NSDictionary *params = [self getLatestReferringParams];
    if ([[params objectForKey:BRANCH_INIT_KEY_CLICKED_BRANCH_LINK] boolValue]) {
        return [BranchLinkProperties getBranchLinkPropertiesFromDictionary:params];
    }
    return nil;
}

#pragma mark - ShortUrl methods

- (NSString *)getShortURL {
    return [self generateShortUrl:nil andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:nil andFeature:nil andStage:nil andCampaign:nil andParams:nil ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params {
    return [self generateShortUrl:nil andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:nil andFeature:nil andStage:nil andCampaign:nil andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params andTags:(NSArray *)tags andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage {
    return [self generateShortUrl:tags andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params andTags:(NSArray *)tags andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andAlias:(NSString *)alias {
    return [self generateShortUrl:tags andAlias:alias andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params andTags:(NSArray *)tags andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andAlias:(NSString *)alias ignoreUAString:(NSString *)ignoreUAString {
    return [self generateShortUrl:tags andAlias:alias andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params ignoreUAString:ignoreUAString forceLinkCreation:YES];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params andTags:(NSArray *)tags andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andCampaign:(NSString *)campaign andAlias:(NSString *)alias ignoreUAString:(NSString *)ignoreUAString forceLinkCreation:(BOOL)forceLinkCreation {
    return [self generateShortUrl:tags andAlias:alias andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:campaign andParams:params ignoreUAString:ignoreUAString forceLinkCreation:forceLinkCreation];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params andTags:(NSArray *)tags andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andType:(BranchLinkType)type {
    return [self generateShortUrl:tags andAlias:nil andType:type andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params andTags:(NSArray *)tags andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andMatchDuration:(NSUInteger)duration {
    return [self generateShortUrl:tags andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:duration andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage {
    return [self generateShortUrl:nil andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andAlias:(NSString *)alias {
    return [self generateShortUrl:nil andAlias:alias andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andType:(BranchLinkType)type {
    return [self generateShortUrl:nil andAlias:nil andType:type andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andMatchDuration:(NSUInteger)duration {
    return [self generateShortUrl:nil andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:duration andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortURLWithParams:(NSDictionary *)params andChannel:(NSString *)channel andFeature:(NSString *)feature {
    return [self generateShortUrl:nil andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:nil andCampaign:nil andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortUrlWithParams:(NSDictionary *)params andTags:(NSArray *)tags andAlias:(NSString *)alias andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andCampaign:(NSString *)campaign andMatchDuration:(NSUInteger)duration {
    return [self generateShortUrl:tags andAlias:alias andType:BranchLinkTypeUnlimitedUse andMatchDuration:duration andChannel:channel andFeature:feature andStage:stage andCampaign:campaign andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (NSString *)getShortUrlWithParams:(NSDictionary *)params andTags:(NSArray *)tags andAlias:(NSString *)alias andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andMatchDuration:(NSUInteger)duration {
    return [self generateShortUrl:tags andAlias:alias andType:BranchLinkTypeUnlimitedUse andMatchDuration:duration andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params ignoreUAString:nil forceLinkCreation:YES];
}

- (void)getShortURLWithCallback:(callbackWithUrl)callback {
    [self generateShortUrl:nil andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:nil andFeature:nil andStage:nil andCampaign:nil andParams:nil andCallback:callback];
}

- (void)getShortURLWithParams:(NSDictionary *)params andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:nil andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:nil andFeature:nil andStage:nil andCampaign:nil andParams:params andCallback:callback];
}

- (void)getShortURLWithParams:(NSDictionary *)params andTags:(NSArray *)tags andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:tags andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params andCallback:callback];
}

- (void)getShortURLWithParams:(NSDictionary *)params andTags:(NSArray *)tags andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andAlias:(NSString *)alias andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:tags andAlias:alias andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params andCallback:callback];
}

- (void)getShortURLWithParams:(NSDictionary *)params andTags:(NSArray *)tags andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andType:(BranchLinkType)type andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:tags andAlias:nil andType:type andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params andCallback:callback];
}

- (void)getShortURLWithParams:(NSDictionary *)params andTags:(NSArray *)tags andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andMatchDuration:(NSUInteger)duration andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:tags andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:duration andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params andCallback:callback];
}

- (void)getShortURLWithParams:(NSDictionary *)params andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:nil andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params andCallback:callback];
}

- (void)getShortURLWithParams:(NSDictionary *)params andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andAlias:(NSString *)alias andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:nil andAlias:alias andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params andCallback:callback];
}

- (void)getShortURLWithParams:(NSDictionary *)params andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andType:(BranchLinkType)type andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:nil andAlias:nil andType:type andMatchDuration:0 andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params andCallback:callback];
}

- (void)getShortURLWithParams:(NSDictionary *)params andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andMatchDuration:(NSUInteger)duration andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:nil andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:duration andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params andCallback:callback];
}

- (void)getShortURLWithParams:(NSDictionary *)params andChannel:(NSString *)channel andFeature:(NSString *)feature andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:nil andAlias:nil andType:BranchLinkTypeUnlimitedUse andMatchDuration:0 andChannel:channel andFeature:feature andStage:nil andCampaign:nil andParams:params andCallback:callback];
}

- (void)getShortUrlWithParams:(NSDictionary *)params andTags:(NSArray *)tags andAlias:(NSString *)alias andMatchDuration:(NSUInteger)duration andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andCampaign:campaign andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:tags andAlias:alias andType:BranchLinkTypeUnlimitedUse andMatchDuration:duration andChannel:channel andFeature:feature andStage:stage andCampaign:campaign andParams:params andCallback:callback];
}

- (void)getShortUrlWithParams:(NSDictionary *)params andTags:(NSArray *)tags andAlias:(NSString *)alias andMatchDuration:(NSUInteger)duration andChannel:(NSString *)channel andFeature:(NSString *)feature andStage:(NSString *)stage andCallback:(callbackWithUrl)callback {
    [self generateShortUrl:tags andAlias:alias andType:BranchLinkTypeUnlimitedUse andMatchDuration:duration andChannel:channel andFeature:feature andStage:stage andCampaign:nil andParams:params andCallback:callback];
}

- (void)getSpotlightUrlWithParams:(NSDictionary *)params callback:(callbackWithParams)callback {
    [self initSessionIfNeededAndNotInProgress];

    BranchSpotlightUrlRequest *req = [[BranchSpotlightUrlRequest alloc] initWithParams:params callback:callback];
    [self.requestQueue enqueue:req];
    [self processNextQueueItem];
}

#pragma mark - LongUrl methods
- (NSString *)getLongURLWithParams:(NSDictionary *)params andChannel:(NSString *)channel andTags:(NSArray *)tags andFeature:(NSString *)feature andStage:(NSString *)stage andAlias:(NSString *)alias {
    return [self generateLongURLWithParams:params andChannel:channel andTags:tags andFeature:feature andStage:stage andAlias:alias];
}

- (NSString *)getLongURLWithParams:(NSDictionary *)params {
    return [self generateLongURLWithParams:params andChannel:nil andTags:nil andFeature:nil andStage:nil andAlias:nil];
}

- (NSString *)getLongURLWithParams:(NSDictionary *)params andFeature:(NSString *)feature {
    return [self generateLongURLWithParams:params andChannel:nil andTags:nil andFeature:feature andStage:nil andAlias:nil];
}

- (NSString *)getLongURLWithParams:(NSDictionary *)params andFeature:(NSString *)feature andStage:(NSString *)stage {
    return [self generateLongURLWithParams:params andChannel:nil andTags:nil andFeature:feature andStage:stage andAlias:nil];
}

- (NSString *)getLongURLWithParams:(NSDictionary *)params andFeature:(NSString *)feature andStage:(NSString *)stage andTags:(NSArray *)tags {
    return [self generateLongURLWithParams:params andChannel:nil andTags:tags andFeature:feature andStage:stage andAlias:nil];
}

- (NSString *)getLongURLWithParams:(NSDictionary *)params andFeature:(NSString *)feature andStage:(NSString *)stage andAlias:(NSString *)alias {
    return [self generateLongURLWithParams:params andChannel:nil andTags:nil andFeature:feature andStage:stage andAlias:alias];
}

#pragma mark - Discoverable content methods

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description];
}

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description callback:(callbackWithUrl)callback {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description callback:callback];
}

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable callback:(callbackWithUrl)callback {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description publiclyIndexable:publiclyIndexable callback:callback];
}

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable callback:(callbackWithUrl)callback {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description publiclyIndexable:publiclyIndexable type:type callback:callback];
}

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable callback:(callbackWithUrl)callback {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description publiclyIndexable:publiclyIndexable type:type thumbnailUrl:thumbnailUrl callback:callback];
}

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords callback:(callbackWithUrl)callback {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description publiclyIndexable:publiclyIndexable type:type thumbnailUrl:thumbnailUrl keywords:keywords callback:callback];
}

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams publiclyIndexable:(BOOL)publiclyIndexable {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description publiclyIndexable:publiclyIndexable thumbnailUrl:thumbnailUrl userInfo:linkParams];
}

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description publiclyIndexable:publiclyIndexable thumbnailUrl:thumbnailUrl keywords:keywords userInfo:linkParams];
}

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description publiclyIndexable:publiclyIndexable type:type thumbnailUrl:thumbnailUrl keywords:keywords userInfo:linkParams];
}

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description publiclyIndexable:publiclyIndexable type:type thumbnailUrl:thumbnailUrl keywords:keywords];
}

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords callback:(callbackWithUrl)callback {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description publiclyIndexable:publiclyIndexable type:type thumbnailUrl:thumbnailUrl keywords:keywords userInfo:linkParams callback:callback];
}
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords expirationDate:(NSDate *)expirationDate callback:(callbackWithUrl)callback {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description publiclyIndexable:publiclyIndexable type:type thumbnailUrl:thumbnailUrl keywords:keywords userInfo:linkParams expirationDate:expirationDate callback:callback];
}
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl canonicalId:canonicalId linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords expirationDate:(NSDate *)expirationDate callback:(callbackWithUrl)callback {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description canonicalId:canonicalId publiclyIndexable:publiclyIndexable type:type thumbnailUrl:thumbnailUrl keywords:keywords userInfo:linkParams expirationDate:expirationDate callback:callback];
}

// Use this with iOS 9+ only
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords expirationDate:(NSDate *)expirationDate spotlightCallback:(callbackWithUrlAndSpotlightIdentifier)spotlightCallback {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description canonicalId:nil publiclyIndexable:publiclyIndexable type:type thumbnailUrl:thumbnailUrl keywords:keywords userInfo:linkParams expirationDate:expirationDate callback:nil spotlightCallback:spotlightCallback];
}

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl canonicalId:(NSString *)canonicalId linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords expirationDate:(NSDate *)expirationDate spotlightCallback:(callbackWithUrlAndSpotlightIdentifier)spotlightCallback {
    [self.contentDiscoveryManager indexContentWithTitle:title description:description canonicalId:canonicalId publiclyIndexable:publiclyIndexable type:type thumbnailUrl:thumbnailUrl keywords:keywords userInfo:linkParams expirationDate:expirationDate callback:nil spotlightCallback:spotlightCallback];
}

- (void)indexOnSpotlightWithBranchUniversalObject:(BranchUniversalObject*)universalObject
                                   linkProperties:(BranchLinkProperties*)linkProperties
                                       completion:(void (^) (BranchUniversalObject *universalObject, NSString * url,NSError *error))completion {
    BNCSpotlightService *spotlightService = [[BNCSpotlightService alloc] init];

    if (!universalObject) {
        NSError* error = [NSError branchErrorWithCode:BNCInitError localizedMessage:@"Branch Universal Object is nil"];
        if (completion) completion(universalObject,nil,error);
        return;
    } else {
        [spotlightService indexWithBranchUniversalObject:universalObject
                                          linkProperties:linkProperties
                                                callback:^(BranchUniversalObject * _Nullable universalObject,
                                                           NSString * _Nullable url,
                                                           NSError * _Nullable error) {
                                              if (completion) completion(universalObject,url,error);
                                          }];
    }
}

/* Indexing of multiple BUOs
 * Content privately indexed irrestive of the value of contentIndexMode
 */


- (void)indexOnSpotlightUsingSearchableItems:(NSArray<BranchUniversalObject*>* )universalObjects
                                  completion:(void (^) (NSArray<BranchUniversalObject*>* universalObjects,
                                                        NSError* error))completion {

    BNCSpotlightService *spotlight = [[BNCSpotlightService alloc] init];
    [spotlight indexPrivatelyWithBranchUniversalObjects:universalObjects
                                             completion:^(NSArray<BranchUniversalObject *> * _Nullable universalObjects,
                                                          NSError * _Nullable error) {
                                                 if (completion) completion(universalObjects,error);
                                             }];
}

- (void)removeSearchableItemWithBranchUniversalObject:(BranchUniversalObject *)universalObject
                                             callback:(void (^_Nullable)(NSError * _Nullable error))completion {
    BNCSpotlightService *spotlight = [[BNCSpotlightService alloc] init];

    NSString *dynamicUrl = [universalObject getLongUrlWithChannel:nil
                                                          andTags:nil
                                                       andFeature:BNCSpotlightFeature
                                                         andStage:nil
                                                         andAlias:nil];
    [spotlight removeSearchableItemsWithIdentifier:dynamicUrl
                                          callback:^(NSError * _Nullable error) {
                                              if (completion) completion(error);
                                          }];
}


/* Only removes the indexing of BUOs indexed through CSSearchable item
 */
- (void)removeSearchableItemsWithBranchUniversalObjects:(NSArray<BranchUniversalObject*> *)universalObjects
                                               callback:(void (^)(NSError * error))completion {
    BNCSpotlightService *spotlight = [[BNCSpotlightService alloc] init];
    NSMutableArray<NSString *> *identifiers = [[NSMutableArray alloc] init];
    for (BranchUniversalObject* universalObject in universalObjects) {
        NSString *dynamicUrl = [universalObject getLongUrlWithChannel:nil
                                                              andTags:nil
                                                           andFeature:BNCSpotlightFeature
                                                             andStage:nil andAlias:nil];
        if (dynamicUrl) [identifiers addObject:dynamicUrl];
    }

    [spotlight removeSearchableItemsWithIdentifiers:identifiers
                                           callback:^(NSError * error) {
                                               if (completion)
                                                   completion(error);
                                           }];
}

/* Removes all content from spotlight indexed through CSSearchable item and has set the Domain identifier = "com.branch.io"
 */

- (void)removeAllPrivateContentFromSpotLightWithCallback:(void (^)(NSError * error))completion {
    BNCSpotlightService *spotlight = [[BNCSpotlightService alloc] init];
    [spotlight removeAllBranchSearchableItemsWithCallback:^(NSError * _Nullable error) {
        completion(error);
    }];
}

#pragma mark - Private methods

+ (Branch *)getInstanceInternal:(NSString *)key returnNilIfNoCurrentInstance:(BOOL)returnNilIfNoCurrentInstance {

    static Branch *branch = nil;
    @synchronized (self) {
        if (!branch && returnNilIfNoCurrentInstance) {
            return nil;
        }

        static dispatch_once_t onceToken = 0;
        dispatch_once(&onceToken, ^{
            BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];

            // If there was stored key and it isn't the same as the currently used (or doesn't exist), we need to clean up
            // Note: Link Click Identifier is not cleared because of the potential for that to mess up a deep link
            if (preferenceHelper.lastRunBranchKey && ![key isEqualToString:preferenceHelper.lastRunBranchKey]) {
                BNCLogWarning(@"The Branch Key has changed, clearing relevant items.");

                preferenceHelper.appVersion = nil;
                preferenceHelper.deviceFingerprintID = nil;
                preferenceHelper.sessionID = nil;
                preferenceHelper.identityID = nil;
                preferenceHelper.userUrl = nil;
                preferenceHelper.installParams = nil;
                preferenceHelper.sessionParams = nil;

                [[BNCServerRequestQueue getInstance] clearQueue];
            }

            if (self.enableFingerprintIDInCrashlyticsReports) {
                BNCCrashlyticsWrapper *crashlytics = [BNCCrashlyticsWrapper wrapper];
                // may be nil
                [crashlytics setObjectValue:preferenceHelper.deviceFingerprintID forKey:BRANCH_CRASHLYTICS_FINGERPRINT_ID_KEY];
            }

            preferenceHelper.lastRunBranchKey = key;
            branch =
                [[Branch alloc] initWithInterface:[[BNCServerInterface alloc] init]
                    queue:[BNCServerRequestQueue getInstance]
                    cache:[[BNCLinkCache alloc] init]
                    preferenceHelper:preferenceHelper
                    key:key];
        });
        return branch;
    }
}


#pragma mark - URL Generation methods

- (void)generateShortUrl:(NSArray *)tags
                andAlias:(NSString *)alias
                 andType:(BranchLinkType)type
        andMatchDuration:(NSUInteger)duration
              andChannel:(NSString *)channel
              andFeature:(NSString *)feature
                andStage:(NSString *)stage
             andCampaign:campaign andParams:(NSDictionary *)params
             andCallback:(callbackWithUrl)callback {
    [self initSessionIfNeededAndNotInProgress];

    BNCLinkData *linkData = [self prepareLinkDataFor:tags
                                            andAlias:alias
                                             andType:type
                                    andMatchDuration:duration
                                          andChannel:channel
                                          andFeature:feature
                                            andStage:stage
                                         andCampaign:campaign
                                           andParams:params
                                      ignoreUAString:nil];

    if ([self.linkCache objectForKey:linkData]) {
        if (callback) {
            callback([self.linkCache objectForKey:linkData], nil);
        }
        return;
    }

    BranchShortUrlRequest *req = [[BranchShortUrlRequest alloc] initWithTags:tags
                                                                       alias:alias
                                                                        type:type
                                                               matchDuration:duration
                                                                     channel:channel
                                                                     feature:feature
                                                                       stage:stage
                                                                    campaign:campaign
                                                                      params:params
                                                                    linkData:linkData
                                                                   linkCache:self.linkCache
                                                                    callback:callback];
    [self.requestQueue enqueue:req];
    [self processNextQueueItem];
}

- (NSString *)generateShortUrl:(NSArray *)tags
                      andAlias:(NSString *)alias
                       andType:(BranchLinkType)type
              andMatchDuration:(NSUInteger)duration
                    andChannel:(NSString *)channel
                    andFeature:(NSString *)feature
                      andStage:(NSString *)stage
                   andCampaign:(NSString *)campaign
                     andParams:(NSDictionary *)params
                ignoreUAString:(NSString *)ignoreUAString
             forceLinkCreation:(BOOL)forceLinkCreation {

    NSString *shortURL = nil;

    BNCLinkData *linkData =
        [self prepareLinkDataFor:tags
            andAlias:alias
             andType:type
    andMatchDuration:duration
          andChannel:channel
          andFeature:feature
            andStage:stage
         andCampaign:campaign
           andParams:params
      ignoreUAString:ignoreUAString];

    // If an ignore UA string is present, we always get a new url.
    // Otherwise, if we've already seen this request, use the cached version.
    if (!ignoreUAString && [self.linkCache objectForKey:linkData]) {
        shortURL = [self.linkCache objectForKey:linkData];
    } else {
        BranchShortUrlSyncRequest *req =
            [[BranchShortUrlSyncRequest alloc]
                initWithTags:tags
                alias:alias
                type:type
                matchDuration:duration
                channel:channel
                feature:feature
                stage:stage
                campaign:campaign
                params:params
                linkData:linkData
                linkCache:self.linkCache];

        if (self.initializationStatus == BNCInitStatusInitialized) {
            BNCLogDebug(@"Creating a custom URL synchronously.");
            BNCServerResponse *serverResponse = [req makeRequest:self.serverInterface key:self.class.branchKey];
            shortURL = [req processResponse:serverResponse];

            // cache the link
            if (shortURL) {
                [self.linkCache setObject:shortURL forKey:linkData];
            }
        } else {
            if (forceLinkCreation) {
                if (self.class.branchKey) {
                    return [BranchShortUrlSyncRequest createLinkFromBranchKey:self.class.branchKey
                        tags:tags alias:alias type:type matchDuration:duration
                            channel:channel feature:feature stage:stage params:params];
                }
            }
            BNCLogError(@"Making a Branch request before init has succeeded!");
        }
    }

    return shortURL;
}

- (NSString *)generateLongURLWithParams:(NSDictionary *)params
                             andChannel:(NSString *)channel
                                andTags:(NSArray *)tags
                             andFeature:(NSString *)feature
                               andStage:(NSString *)stage
                               andAlias:(NSString *)alias {

    NSString *baseLongUrl = [NSString stringWithFormat:@"%@/a/%@", BNC_LINK_URL, self.class.branchKey];

    return [self longUrlWithBaseUrl:baseLongUrl params:params tags:tags feature:feature
        channel:nil stage:stage alias:alias duration:0 type:BranchLinkTypeUnlimitedUse];
}

- (NSString *)longUrlWithBaseUrl:(NSString *)baseUrl
                          params:(NSDictionary *)params
                            tags:(NSArray *)tags
                         feature:(NSString *)feature
                         channel:(NSString *)channel
                           stage:(NSString *)stage
                           alias:(NSString *)alias
                        duration:(NSUInteger)duration
                            type:(BranchLinkType)type {

    NSMutableString *longUrl = [self.preferenceHelper sanitizedMutableBaseURL:baseUrl];
    for (NSString *tag in tags) {
        [longUrl appendFormat:@"tags=%@&", [BNCEncodingUtils stringByPercentEncodingStringForQuery:tag]];
    }

    if ([alias length]) {
        [longUrl appendFormat:@"alias=%@&", [BNCEncodingUtils stringByPercentEncodingStringForQuery:alias]];
    }

    if ([channel length]) {
        [longUrl appendFormat:@"channel=%@&", [BNCEncodingUtils stringByPercentEncodingStringForQuery:channel]];
    }

    if ([feature length]) {
        [longUrl appendFormat:@"feature=%@&", [BNCEncodingUtils stringByPercentEncodingStringForQuery:feature]];
    }

    if ([stage length]) {
        [longUrl appendFormat:@"stage=%@&", [BNCEncodingUtils stringByPercentEncodingStringForQuery:stage]];
    }
    if (type) {
        [longUrl appendFormat:@"type=%ld&", (long)type];
    }
    if (duration) {
        [longUrl appendFormat:@"matchDuration=%ld&", (long)duration];
    }

    NSData *jsonData = [BNCEncodingUtils encodeDictionaryToJsonData:params];
    NSString *base64EncodedParams = [BNCEncodingUtils base64EncodeData:jsonData];
    [longUrl appendFormat:@"source=ios&data=%@", base64EncodedParams];

    return longUrl;
}

- (BNCLinkData *)prepareLinkDataFor:(NSArray *)tags
                           andAlias:(NSString *)alias
                            andType:(BranchLinkType)type
                   andMatchDuration:(NSUInteger)duration
                         andChannel:(NSString *)channel
                         andFeature:(NSString *)feature
                           andStage:(NSString *)stage
                        andCampaign:(NSString *)campaign
                          andParams:(NSDictionary *)params
                     ignoreUAString:(NSString *)ignoreUAString {

    BNCLinkData *post = [[BNCLinkData alloc] init];

    [post setupType:type];
    [post setupTags:tags];
    [post setupChannel:channel];
    [post setupFeature:feature];
    [post setupStage:stage];
    [post setupCampaign:campaign];
    [post setupAlias:alias];
    [post setupMatchDuration:duration];
    [post setupIgnoreUAString:ignoreUAString];
    [post setupParams:params];

    return post;
}

#pragma mark - BranchUniversalObject methods

- (void)registerViewWithParams:(NSDictionary *)params andCallback:(callbackWithParams)callback {
    [self initSessionIfNeededAndNotInProgress];
    BranchUniversalObject *buo = [[BranchUniversalObject alloc] init];
    buo.contentMetadata.customMetadata = (id) params;
    [[BranchEvent standardEvent:BranchStandardEventViewItem withContentItem:buo] logEvent];
    if (callback) callback(@{}, nil);
}

#pragma mark - Application State Change methods

- (void)applicationDidBecomeActive {
    if (!Branch.trackingDisabled) {
        if ((self.initializationStatus != BNCInitStatusInitialized) &&
            !self.preferenceHelper.shouldWaitForInit &&
            ![self.requestQueue containsInstallOrOpen]) {
            [self initUserSessionAndCallCallback:YES];
        }
    }
}

- (void)applicationWillResignActive {
    if (!Branch.trackingDisabled) {
        [self callClose];
        [self.requestQueue persistImmediately];
        [BranchOpenRequest setWaitNeededForOpenResponseLock];
        BNCLogDebugSDK(@"Application resigned active.");
        [self.class closeLog];
        [self.class openLog];
    }
}

- (void)callClose {
    if (self.initializationStatus != BNCInitStatusUninitialized) {
        self.initializationStatus = BNCInitStatusUninitialized;
        
        BranchContentDiscoverer *contentDiscoverer = [BranchContentDiscoverer getInstance];
        if (contentDiscoverer) [contentDiscoverer stopDiscoveryTask];

        if (self.preferenceHelper.sessionID && ![self.requestQueue containsClose]) {
            BranchCloseRequest *req = [[BranchCloseRequest alloc] init];
            [self.requestQueue enqueue:req];
            [self processNextQueueItem];
        }
    }
}

#pragma mark - Queue management

- (NSInteger) networkCount {
    @synchronized (self) {
        return _networkCount;
    }
}

- (void) setNetworkCount:(NSInteger)networkCount {
    @synchronized (self) {
        _networkCount = networkCount;
    }
}

- (void)insertRequestAtFront:(BNCServerRequest *)req {
    if (self.networkCount == 0) {
        [self.requestQueue insert:req at:0];
    }
    else {
        [self.requestQueue insert:req at:1];
    }
}

static inline void BNCPerformBlockOnMainThreadSync(dispatch_block_t block) {
    if (block) {
        if ([NSThread isMainThread]) {
            block();
        } else {
            dispatch_sync(dispatch_get_main_queue(), block);
        }
    }
}

//static inline void BNCPerformBlockOnMainThreadAsync(dispatch_block_t block) {
//    dispatch_async(dispatch_get_main_queue(), block);
//}

- (void) processRequest:(BNCServerRequest*)req
               response:(BNCServerResponse*)response
                  error:(NSError*)error {

    // If the request was successful, or was a bad user request, continue processing.
    if (!error ||
        error.code == BNCTrackingDisabledError ||
        error.code == BNCBadRequestError ||
        error.code == BNCDuplicateResourceError) {

        BNCPerformBlockOnMainThreadSync(^{ [req processResponse:response error:error]; });

        [self.requestQueue dequeue];
        self.networkCount = 0;
        [self processNextQueueItem];
    }
    // On network problems, or Branch down, call the other callbacks and stop processing.
    else {
        BNCLogDebugSDK(@"Network error: failing queued requests.");

        // First, gather all the requests to fail
        NSMutableArray *requestsToFail = [[NSMutableArray alloc] init];
        for (int i = 0; i < self.requestQueue.queueDepth; i++) {
            BNCServerRequest *request = [self.requestQueue peekAt:i];
            if (request) {
                [requestsToFail addObject:request];
            }
        }

        // Next, remove all the requests that should not be replayed. Note, we do this before
        // calling callbacks, in case any of the callbacks try to kick off another request, which
        // could potentially start another request (and call these callbacks again)

        NSSet<Class> *replayableRequests = [[NSSet alloc] initWithArray:@[
            BranchEventRequest.class,
            BranchUserCompletedActionRequest.class,
            BranchSetIdentityRequest.class,
            BranchCommerceEventRequest.class,
        ]];

        for (BNCServerRequest *request in requestsToFail) {
            if (Branch.trackingDisabled || ![replayableRequests containsObject:request.class]) {
                [self.requestQueue remove:request];
            }
        }

        // Then, set the network count to zero, indicating that requests can be started again
        self.networkCount = 0;

        // Finally, call all the requests callbacks with the error
        for (BNCServerRequest *request in requestsToFail) {
            BNCPerformBlockOnMainThreadSync(^ { [request processResponse:nil error:error]; });
        }
    }
}

- (void)processNextQueueItem {
    dispatch_semaphore_wait(self.processing_sema, DISPATCH_TIME_FOREVER);

    if (self.networkCount == 0 &&
        self.requestQueue.queueDepth > 0 &&
        !self.preferenceHelper.shouldWaitForInit) {

        self.networkCount = 1;
        dispatch_semaphore_signal(self.processing_sema);
        BNCServerRequest *req = [self.requestQueue peek];

        if (req) {

            if (![req isKindOfClass:[BranchInstallRequest class]] && !self.preferenceHelper.identityID) {
                BNCLogError(@"User session has not been initialized!");
                BNCPerformBlockOnMainThreadSync(^{
                    [req processResponse:nil error:[NSError branchErrorWithCode:BNCInitError]];
                });
                return;
                
            } else if (![req isKindOfClass:[BranchOpenRequest class]] &&
                (!self.preferenceHelper.deviceFingerprintID || !self.preferenceHelper.sessionID)) {
                BNCLogError(@"Missing session items!");
                BNCPerformBlockOnMainThreadSync(^{
                    [req processResponse:nil error:[NSError branchErrorWithCode:BNCInitError]];
                });
                return;
                
            }

            dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0);
            dispatch_async(queue, ^ {
                [req makeRequest:self.serverInterface key:self.class.branchKey callback:
                    ^(BNCServerResponse* response, NSError* error) {
                        [self processRequest:req response:response error:error];
                }];
            });
        }
    }
    else {
        dispatch_semaphore_signal(self.processing_sema);
    }
}

- (void) clearNetworkQueue {
    dispatch_semaphore_wait(self.processing_sema, DISPATCH_TIME_FOREVER);
    self.networkCount = 0;
    [[BNCServerRequestQueue getInstance] clearQueue];
    dispatch_semaphore_signal(self.processing_sema);
}

#pragma mark - Session Initialization

- (void)initSessionIfNeededAndNotInProgress {
    if (self.initializationStatus == BNCInitStatusUninitialized &&
        !self.preferenceHelper.shouldWaitForInit &&
        ![self.requestQueue containsInstallOrOpen]) {
        [self initUserSessionAndCallCallback:NO];
    }
}

- (void)initUserSessionAndCallCallback:(BOOL)callCallback {
    self.shouldCallSessionInitCallback = callCallback;

    NSString *urlstring = nil;
    if (self.preferenceHelper.universalLinkUrl.length)
        urlstring = self.preferenceHelper.universalLinkUrl;
    else
    if (self.preferenceHelper.externalIntentURI.length)
        urlstring = self.preferenceHelper.externalIntentURI;

    if (urlstring.length) {
        NSArray<BNCKeyValue*> *queryItems = [BNCEncodingUtils queryItems:[NSURL URLWithString:urlstring]];
        for (BNCKeyValue*item in queryItems) {
            if ([item.key isEqualToString:@"BranchLogLevel"]) {
                BNCLogLevel logLevel = BNCLogLevelFromString(item.value);
                [[NSUserDefaults standardUserDefaults]
                    setObject:[NSNumber numberWithInteger:logLevel]
                        forKey:BNCLogLevelKey];
                BNCLogSetDisplayLevel(logLevel);
                NSLog(@"[io.branch.sdk] BNCLogLevel set to %ld.", (long) logLevel);
            }
        }
    }
    // If the session is not yet initialized
    if (self.initializationStatus == BNCInitStatusUninitialized) {
        [self initializeSession];
    }
    // If the session was initialized, but callCallback was specified, do so.
    else if (callCallback && self.initializationStatus == BNCInitStatusInitialized) {
        if (self.sessionInitWithParamsCallback) {
            self.sessionInitWithParamsCallback([self getLatestReferringParams], nil);
        }
        else if (self.sessionInitWithBranchUniversalObjectCallback) {
            self.sessionInitWithBranchUniversalObjectCallback(
                [self getLatestReferringBranchUniversalObject],
                [self getLatestReferringBranchLinkProperties],
                nil
            );
        }
    }
}

- (void)initializeSession {
	Class clazz = [BranchInstallRequest class];
	if (self.preferenceHelper.identityID) {
		clazz = [BranchOpenRequest class];
	}

    callbackWithStatus initSessionCallback = ^(BOOL success, NSError *error) {
		dispatch_async(dispatch_get_main_queue(), ^ {
			if (error) {
				[self handleInitFailure:error];
			} else {
				[self handleInitSuccess];
			}
		});
    };

    if ([BNCSystemObserver getOSVersion].integerValue >= 9 && self.useCookieBasedMatching) {
        [[BNCStrongMatchHelper strongMatchHelper] createStrongMatchWithBranchKey:self.class.branchKey];
    }

    // Notify everyone --

    NSURL *URL =
        (self.preferenceHelper.referringURL.length)
        ? [NSURL URLWithString:self.preferenceHelper.referringURL]
        : nil;

    if ([self.delegate respondsToSelector:@selector(branch:willStartSessionWithURL:)])
        [self.delegate branch:self willStartSessionWithURL:URL];

    NSMutableDictionary *userInfo = [NSMutableDictionary new];
    userInfo[BranchURLKey] = URL;
    [[NSNotificationCenter defaultCenter]
        postNotificationName:BranchWillStartSessionNotification
        object:self
        userInfo:userInfo];

    // Fix the queue order and open --

	@synchronized (self) {
        [self removeInstallOrOpen];
		[BranchOpenRequest setWaitNeededForOpenResponseLock];
		BranchOpenRequest *req = [[clazz alloc] initWithCallback:initSessionCallback];
		[self insertRequestAtFront:req];
        self.initializationStatus = BNCInitStatusInitializing;
		[self processNextQueueItem];
	}
}

- (BOOL) removeInstallOrOpen {
	@synchronized (self) {
		if ([self.requestQueue removeInstallOrOpen]) {
			self.networkCount = 0;
            return YES;
        }
        return NO;
    }
}

- (void)handleInitSuccess {

    self.initializationStatus = BNCInitStatusInitialized;
    NSDictionary *latestReferringParams = [self getLatestReferringParams];

    if ([latestReferringParams[@"_branch_validate"] isEqualToString:@"060514"]) {
        [self validateDeeplinkRouting:latestReferringParams];
    }
    else if (([latestReferringParams[@"bnc_validate"] isEqualToString:@"true"])) {
        NSString* referringLink = [self.class returnNonUniversalLink:latestReferringParams[@"~referring_link"] ];
        NSURLComponents *comp = [NSURLComponents componentsWithURL:[NSURL URLWithString:referringLink]
                                           resolvingAgainstBaseURL:NO];
        
        
        #pragma clang diagnostic push
        #pragma clang diagnostic ignored "-Warc-performSelector-leaks"
        Class applicationClass = NSClassFromString(@"UIApplication");
        id<NSObject> sharedApplication = [applicationClass performSelector:@selector(sharedApplication)];
        SEL openURL = @selector(openURL:);
        if ([sharedApplication respondsToSelector:openURL])
            [sharedApplication performSelector:openURL withObject:comp.URL];
        #pragma clang diagnostic pop
    }

    if (self.shouldCallSessionInitCallback) {
        if (self.sessionInitWithParamsCallback) {
            self.sessionInitWithParamsCallback(latestReferringParams, nil);
        }
        else if (self.sessionInitWithBranchUniversalObjectCallback) {
            self.sessionInitWithBranchUniversalObjectCallback(
                [self getLatestReferringBranchUniversalObject],
                [self getLatestReferringBranchLinkProperties],
                nil
            );
        }
    }
    [self sendOpenNotificationWithLinkParameters:latestReferringParams error:nil];

    if (!self.URLBlackList.hasRefreshedBlackListFromServer)
        [self.URLBlackList refreshBlackListFromServerWithCompletion:nil];

    if (self.shouldAutomaticallyDeepLink) {
        // Find any matched keys, then launch any controllers that match
        // TODO which one to launch if more than one match?
        NSMutableSet *keysInParams = [NSMutableSet setWithArray:[latestReferringParams allKeys]];
        NSSet *desiredKeysSet = [NSSet setWithArray:[self.deepLinkControllers allKeys]];
        [keysInParams intersectSet:desiredKeysSet];

        // If we find a matching key, configure and show the controller
        if ([keysInParams count]) {
            NSString *key = [[keysInParams allObjects] firstObject];
            UIViewController <BranchDeepLinkingController> *branchSharingController = self.deepLinkControllers[key];
            if ([branchSharingController respondsToSelector:@selector(configureControlWithData:)]) {
                [branchSharingController configureControlWithData:latestReferringParams];
            }
            else {
                BNCLogWarning(@"The automatic deeplink view controller '%@' for key '%@' does not implement 'configureControlWithData:'.",
                    branchSharingController, key);
            }
            
            self.deepLinkPresentingController = [UIViewController bnc_currentViewController];
            if([self.deepLinkControllers[key] isKindOfClass:[BNCDeepLinkViewControllerInstance class]]) {
                BNCDeepLinkViewControllerInstance* deepLinkInstance = self.deepLinkControllers[key];
                UIViewController <BranchDeepLinkingController> *branchSharingController = deepLinkInstance.viewController;

                if ([branchSharingController respondsToSelector:@selector(configureControlWithData:)]) {
                    [branchSharingController configureControlWithData:latestReferringParams];
                }
                else {
                    BNCLogWarning(@"View controller does not implement configureControlWithData:");
                }
                branchSharingController.deepLinkingCompletionDelegate = self;
                switch (deepLinkInstance.option) {
                    case BNCViewControllerOptionPresent:
                        [self presentSharingViewController:branchSharingController];
                        break;

                    case BNCViewControllerOptionPush:

                        if ([self.deepLinkPresentingController isKindOfClass:[UINavigationController class]]) {

                            if ([[(UINavigationController*)self.deepLinkPresentingController viewControllers]
                                  containsObject:branchSharingController]) {
                                [self removeViewControllerFromRootNavigationController:branchSharingController];
                                [(UINavigationController*)self.deepLinkPresentingController
                                     pushViewController:branchSharingController animated:false];
                            }
                            else {
                                [(UINavigationController*)self.deepLinkPresentingController
                                     pushViewController:branchSharingController animated:true];
                            }
                        }
                        else {
                            deepLinkInstance.option = BNCViewControllerOptionPresent;
                            [self presentSharingViewController:branchSharingController];
                        }

                        break;

                    default:
                        if ([self.deepLinkPresentingController isKindOfClass:[UINavigationController class]]) {
                            if ([self.deepLinkPresentingController respondsToSelector:@selector(showViewController:sender:)]) {

                                if ([[(UINavigationController*)self.deepLinkPresentingController viewControllers]
                                       containsObject:branchSharingController]) {
                                    [self removeViewControllerFromRootNavigationController:branchSharingController];
                                }

                                [self.deepLinkPresentingController showViewController:branchSharingController sender:self];
                            }
                            else {
                                deepLinkInstance.option = BNCViewControllerOptionPush;
                                [(UINavigationController*)self.deepLinkPresentingController
                                     pushViewController:branchSharingController animated:true];
                            }
                        }
                        else {
                            deepLinkInstance.option = BNCViewControllerOptionPresent;
                            [self presentSharingViewController:branchSharingController];
                        }
                        break;
                }
            }
            else {

                //Support for old API
                UIViewController <BranchDeepLinkingController> *branchSharingController = self.deepLinkControllers[key];
                if ([branchSharingController respondsToSelector:@selector(configureControlWithData:)]) {
                    [branchSharingController configureControlWithData:latestReferringParams];
                }
                else {
                    BNCLogWarning(@"View controller does not implement configureControlWithData:");
                }
                branchSharingController.deepLinkingCompletionDelegate = self;
                if ([self.deepLinkPresentingController presentedViewController]) {
                    [self.deepLinkPresentingController dismissViewControllerAnimated:NO completion:^{
                        [self.deepLinkPresentingController presentViewController:branchSharingController animated:YES completion:NULL];
                    }];
                }
                else {
                    [self.deepLinkPresentingController presentViewController:branchSharingController animated:YES completion:NULL];
                }
            }
        }
    }
}

- (void) sendOpenNotificationWithLinkParameters:(NSDictionary*)linkParameters
                                          error:(NSError*)error {

    NSURL *originalURL =
        (self.preferenceHelper.referringURL.length)
        ? [NSURL URLWithString:self.preferenceHelper.referringURL]
        : nil;
    BranchLinkProperties *linkProperties = nil;
    BranchUniversalObject *universalObject = nil;

    NSNumber *isBranchLink = linkParameters[BRANCH_INIT_KEY_CLICKED_BRANCH_LINK];
    if ([isBranchLink boolValue]) {
        universalObject = [BranchUniversalObject objectWithDictionary:linkParameters];
        linkProperties = [BranchLinkProperties getBranchLinkPropertiesFromDictionary:linkParameters];
    }

    if (error) {

        if ([self.delegate respondsToSelector:@selector(branch:failedToStartSessionWithURL:error:)])
            [self.delegate branch:self failedToStartSessionWithURL:originalURL error:error];

    } else {

        BranchLink *branchLink = nil;
        if (universalObject) {
            branchLink = [BranchLink linkWithUniversalObject:universalObject properties:linkProperties];
        }
        if ([self.delegate respondsToSelector:@selector(branch:didStartSessionWithURL:branchLink:)])
            [self.delegate branch:self didStartSessionWithURL:originalURL branchLink:branchLink];

    }

    NSMutableDictionary *userInfo = [NSMutableDictionary new];
    userInfo[BranchErrorKey] = error;
    userInfo[BranchURLKey] = originalURL;
    userInfo[BranchUniversalObjectKey] = universalObject;
    userInfo[BranchLinkPropertiesKey] = linkProperties;
    [[NSNotificationCenter defaultCenter]
        postNotificationName:BranchDidStartSessionNotification
        object:self
        userInfo:userInfo];

    self.preferenceHelper.referringURL = nil;
}

-(void)removeViewControllerFromRootNavigationController:(UIViewController*)branchSharingController{

    NSMutableArray* viewControllers =
        [NSMutableArray arrayWithArray: [(UINavigationController*)self.deepLinkPresentingController viewControllers]];

    if ([viewControllers lastObject] == branchSharingController) {

        [(UINavigationController*)self.deepLinkPresentingController popViewControllerAnimated:YES];
    }else {
        [viewControllers removeObject:branchSharingController];
        ((UINavigationController*)self.deepLinkPresentingController).viewControllers = viewControllers;
    }
}

-(void)presentSharingViewController: (UIViewController <BranchDeepLinkingController> *)branchSharingController{
    if ([self.deepLinkPresentingController presentedViewController]) {
        [self.deepLinkPresentingController dismissViewControllerAnimated:NO completion:^{
            [self.deepLinkPresentingController presentViewController:branchSharingController animated:YES completion:NULL];
        }];
    }
    else {
        [self.deepLinkPresentingController presentViewController:branchSharingController animated:YES completion:NULL];
    }
}

- (void)handleInitFailure:(NSError *)error {
    self.initializationStatus = BNCInitStatusUninitialized;
    
    if (self.shouldCallSessionInitCallback) {
        if (self.sessionInitWithParamsCallback) {
            self.sessionInitWithParamsCallback([[NSDictionary alloc] init], error);
        }
        else if (self.sessionInitWithBranchUniversalObjectCallback) {
            self.sessionInitWithBranchUniversalObjectCallback(
                [[BranchUniversalObject alloc] init],
                [[BranchLinkProperties alloc] init],
                error
            );
        }
    }

    [self sendOpenNotificationWithLinkParameters:@{} error:error];
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}


#pragma mark - BranchDeepLinkingControllerCompletionDelegate methods


#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
- (void)deepLinkingControllerCompleted {
    [self.deepLinkPresentingController dismissViewControllerAnimated:YES completion:NULL];
}
#pragma clang diagnostic pop

- (void)deepLinkingControllerCompletedFrom:(UIViewController *)viewController {
    [self.deepLinkControllers enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {

        if([obj isKindOfClass:[BNCDeepLinkViewControllerInstance class]]) {
            BNCDeepLinkViewControllerInstance* deepLinkInstance = (BNCDeepLinkViewControllerInstance*) obj;

            if (deepLinkInstance.viewController == viewController) {

                switch (deepLinkInstance.option) {
                    case BNCViewControllerOptionPresent:
                        [viewController dismissViewControllerAnimated:YES completion:nil];
                        break;

                    default:
                        [self removeViewControllerFromRootNavigationController:viewController];
                        break;
                }
            }

        } else {
            //Support for old API
            if ((UIViewController*)obj == viewController)
                [self.deepLinkPresentingController dismissViewControllerAnimated:YES completion:nil];
        }

    }];
}

#pragma mark - Crashlytics reporting enhancements

+ (void)logLowMemoryToCrashlytics {
    [NSNotificationCenter.defaultCenter
        addObserverForName:UIApplicationDidReceiveMemoryWarningNotification
        object:nil
        queue:NSOperationQueue.mainQueue
        usingBlock:^(NSNotification *notification) {
            BNCCrashlyticsWrapper *crashlytics = [BNCCrashlyticsWrapper wrapper];
            [crashlytics setBoolValue:YES forKey:BRANCH_CRASHLYTICS_LOW_MEMORY_KEY];
        }
    ];
}

+ (void)addBranchSDKVersionToCrashlyticsReport {
    BNCCrashlyticsWrapper *crashlytics = [BNCCrashlyticsWrapper wrapper];
    [crashlytics setObjectValue:BNC_SDK_VERSION forKey:BRANCH_CRASHLYTICS_SDK_VERSION_KEY];
}

+ (void) clearAll {
    [[BNCServerRequestQueue getInstance] clearQueue];
    [BranchOpenRequest releaseOpenResponseLock];
    [BNCPreferenceHelper clearAll];
}

@end
