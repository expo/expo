//
//  BNCPreferenceHelper.m
//  Branch-SDK
//
//  Created by Alex Austin on 6/6/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#import "BNCPreferenceHelper.h"
#import "BNCEncodingUtils.h"
#import "BNCConfig.h"
#import "Branch.h"
#import "BNCLog.h"
#import "BNCFabricAnswers.h"
#import "BranchConstants.h"
#import "NSString+Branch.h"

static const NSTimeInterval DEFAULT_TIMEOUT = 5.5;
static const NSTimeInterval DEFAULT_RETRY_INTERVAL = 0;
static const NSInteger DEFAULT_RETRY_COUNT = 3;

static NSString * const BRANCH_PREFS_FILE = @"BNCPreferences";

static NSString * const BRANCH_PREFS_KEY_APP_VERSION = @"bnc_app_version";
static NSString * const BRANCH_PREFS_KEY_LAST_RUN_BRANCH_KEY = @"bnc_last_run_branch_key";
static NSString * const BRANCH_PREFS_KEY_LAST_STRONG_MATCH_DATE = @"bnc_strong_match_created_date";
static NSString * const BRANCH_PREFS_KEY_DEVICE_FINGERPRINT_ID = @"bnc_device_fingerprint_id";
static NSString * const BRANCH_PREFS_KEY_SESSION_ID = @"bnc_session_id";
static NSString * const BRANCH_PREFS_KEY_IDENTITY_ID = @"bnc_identity_id";
static NSString * const BRANCH_PREFS_KEY_IDENTITY = @"bnc_identity";
static NSString * const BRANCH_PREFS_KEY_CHECKED_FACEBOOK_APP_LINKS = @"bnc_checked_fb_app_links";
static NSString * const BRANCH_PREFS_KEY_CHECKED_APPLE_SEARCH_ADS = @"bnc_checked_apple_search_ads";
static NSString * const BRANCH_PREFS_KEY_APPLE_SEARCH_ADS_INFO = @"bnc_apple_search_ads_info";
static NSString * const BRANCH_PREFS_KEY_LINK_CLICK_IDENTIFIER = @"bnc_link_click_identifier";
static NSString * const BRANCH_PREFS_KEY_SPOTLIGHT_IDENTIFIER = @"bnc_spotlight_identifier";
static NSString * const BRANCH_PREFS_KEY_UNIVERSAL_LINK_URL = @"bnc_universal_link_url";
static NSString * const BRANCH_PREFS_KEY_SESSION_PARAMS = @"bnc_session_params";
static NSString * const BRANCH_PREFS_KEY_INSTALL_PARAMS = @"bnc_install_params";
static NSString * const BRANCH_PREFS_KEY_USER_URL = @"bnc_user_url";
static NSString * const BRANCH_PREFS_KEY_BRANCH_UNIVERSAL_LINK_DOMAINS = @"branch_universal_link_domains";

static NSString * const BRANCH_PREFS_KEY_CREDITS = @"bnc_credits";
static NSString * const BRANCH_PREFS_KEY_CREDIT_BASE = @"bnc_credit_base_";

static NSString * const BRANCH_PREFS_KEY_BRANCH_VIEW_USAGE_CNT = @"bnc_branch_view_usage_cnt_";
static NSString * const BRANCH_PREFS_KEY_ANALYTICAL_DATA = @"bnc_branch_analytical_data";
static NSString * const BRANCH_PREFS_KEY_ANALYTICS_MANIFEST = @"bnc_branch_analytics_manifest";

@interface BNCPreferenceHelper () {
    NSOperationQueue *_persistPrefsQueue;
    NSString         *_lastSystemBuildVersion;
    NSString         *_browserUserAgentString;
    NSString         *_branchAPIURL;
    NSString         *_referringURL;
}

@property (strong, nonatomic) NSMutableDictionary *persistenceDict;
@property (strong, nonatomic) NSMutableDictionary *creditsDictionary;
@property (strong, nonatomic) NSMutableDictionary *requestMetadataDictionary;
@property (strong, nonatomic) NSMutableDictionary *instrumentationDictionary;
@end

@implementation BNCPreferenceHelper

@synthesize
            lastRunBranchKey = _lastRunBranchKey,
            appVersion = _appVersion,
            deviceFingerprintID = _deviceFingerprintID,
            sessionID = _sessionID,
            spotlightIdentifier = _spotlightIdentifier,
            identityID = _identityID,
            linkClickIdentifier = _linkClickIdentifier,
            userUrl = _userUrl,
            userIdentity = _userIdentity,
            sessionParams = _sessionParams,
            installParams = _installParams,
            universalLinkUrl = _universalLinkUrl,
            externalIntentURI = _externalIntentURI,
            isDebug = _isDebug,
            shouldWaitForInit = _shouldWaitForInit,
            retryCount = _retryCount,
            retryInterval = _retryInterval,
            timeout = _timeout,
            lastStrongMatchDate = _lastStrongMatchDate,
            checkedFacebookAppLinks = _checkedFacebookAppLinks,
            checkedAppleSearchAdAttribution = _checkedAppleSearchAdAttribution,
            appleSearchAdDetails = _appleSearchAdDetails,
            requestMetadataDictionary = _requestMetadataDictionary,
            instrumentationDictionary = _instrumentationDictionary;

+ (BNCPreferenceHelper *)preferenceHelper {
    static BNCPreferenceHelper *preferenceHelper;
    static dispatch_once_t onceToken;
    
    dispatch_once(&onceToken, ^{
        preferenceHelper = [[BNCPreferenceHelper alloc] init];
    });
    
    return preferenceHelper;
}

- (id)init {
    self = [super init];
    if (!self) return self;

    _timeout = DEFAULT_TIMEOUT;
    _retryCount = DEFAULT_RETRY_COUNT;
    _retryInterval = DEFAULT_RETRY_INTERVAL;
    _isDebug = NO;
    _persistPrefsQueue = [[NSOperationQueue alloc] init];
    _persistPrefsQueue.maxConcurrentOperationCount = 1;

    return self;
}

+ (BNCPreferenceHelper *)getInstance {
    static BNCPreferenceHelper *preferenceHelper;
    static dispatch_once_t onceToken;
    
    dispatch_once(&onceToken, ^{
        preferenceHelper = [[BNCPreferenceHelper alloc] init];
    });
    
    return preferenceHelper;
}

- (void) synchronize {
    [_persistPrefsQueue waitUntilAllOperationsAreFinished];
}

- (void) dealloc {
    [self synchronize];
}

#pragma mark - API methods

- (void) setBranchAPIURL:(NSString*)branchAPIURL_ {
    @synchronized (self) {
        _branchAPIURL = [branchAPIURL_ copy];
    }
}

- (NSString*) branchAPIURL {
    @synchronized (self) {
        if (!_branchAPIURL) {
            _branchAPIURL = [BNC_API_BASE_URL copy];
        }
        return _branchAPIURL;
    }
}

- (NSString *)getAPIBaseURL {
    @synchronized (self) {
        return [NSString stringWithFormat:@"%@/%@/", self.branchAPIURL, BNC_API_VERSION];
    }
}

- (NSString *)getAPIURL:(NSString *) endpoint {
    return [[self getAPIBaseURL] stringByAppendingString:endpoint];
}

- (NSString *)getEndpointFromURL:(NSString *)url {
    NSString *APIBase = self.branchAPIURL;
    if ([url hasPrefix:APIBase]) {
        NSUInteger index = APIBase.length;
        return [url substringFromIndex:index];
    }
    return @"";
}

#pragma mark - Preference Storage

- (NSString *)lastRunBranchKey {
    if (!_lastRunBranchKey) {
        _lastRunBranchKey = [self readStringFromDefaults:BRANCH_PREFS_KEY_LAST_RUN_BRANCH_KEY];
    }
    return _lastRunBranchKey;
}

- (void)setLastRunBranchKey:(NSString *)lastRunBranchKey {
    if (![_lastRunBranchKey isEqualToString:lastRunBranchKey]) {
        _lastRunBranchKey = lastRunBranchKey;
        [self writeObjectToDefaults:BRANCH_PREFS_KEY_LAST_RUN_BRANCH_KEY value:lastRunBranchKey];
    }
}

- (NSDate *)lastStrongMatchDate {
    if (!_lastStrongMatchDate) {
        _lastStrongMatchDate = (NSDate *)[self readObjectFromDefaults:BRANCH_PREFS_KEY_LAST_STRONG_MATCH_DATE];
    }
    return _lastStrongMatchDate;
}

- (void)setLastStrongMatchDate:(NSDate *)lastStrongMatchDate {
    if (lastStrongMatchDate == nil || ![_lastStrongMatchDate isEqualToDate:lastStrongMatchDate]) {
        _lastStrongMatchDate = lastStrongMatchDate;
        [self writeObjectToDefaults:BRANCH_PREFS_KEY_LAST_STRONG_MATCH_DATE value:lastStrongMatchDate];
    }
}

- (NSString *)appVersion {
    if (!_appVersion) {
        _appVersion = [self readStringFromDefaults:BRANCH_PREFS_KEY_APP_VERSION];
    }
    return _appVersion;
}

- (void)setAppVersion:(NSString *)appVersion {
    if (![_appVersion isEqualToString:appVersion]) {
        _appVersion = appVersion;
        [self writeObjectToDefaults:BRANCH_PREFS_KEY_APP_VERSION value:appVersion];
    }
}

- (NSString *)deviceFingerprintID {
    if (!_deviceFingerprintID) {
        _deviceFingerprintID = [self readStringFromDefaults:BRANCH_PREFS_KEY_DEVICE_FINGERPRINT_ID];
    }
    
    return _deviceFingerprintID;
}

- (void)setDeviceFingerprintID:(NSString *)deviceFingerprintID {
    if (deviceFingerprintID == nil || ![_deviceFingerprintID isEqualToString:deviceFingerprintID]) {
        _deviceFingerprintID = deviceFingerprintID;
        [self writeObjectToDefaults:BRANCH_PREFS_KEY_DEVICE_FINGERPRINT_ID value:deviceFingerprintID];
    }
}

- (NSString *)sessionID {
    if (!_sessionID) {
        _sessionID = [self readStringFromDefaults:BRANCH_PREFS_KEY_SESSION_ID];
    }
    
    return _sessionID;
}

- (void)setSessionID:(NSString *)sessionID {
    if (sessionID == nil || ![_sessionID isEqualToString:sessionID]) {
        _sessionID = sessionID;
        [self writeObjectToDefaults:BRANCH_PREFS_KEY_SESSION_ID value:sessionID];
    }
}

- (NSString *)identityID {
    return [self readStringFromDefaults:BRANCH_PREFS_KEY_IDENTITY_ID];
}

- (void)setIdentityID:(NSString *)identityID {
    [self writeObjectToDefaults:BRANCH_PREFS_KEY_IDENTITY_ID value:identityID];
}

- (NSString *)userIdentity {
    return [self readStringFromDefaults:BRANCH_PREFS_KEY_IDENTITY];
}

- (void)setUserIdentity:(NSString *)userIdentity {
    [self writeObjectToDefaults:BRANCH_PREFS_KEY_IDENTITY value:userIdentity];
}

- (NSString *)linkClickIdentifier {
    return [self readStringFromDefaults:BRANCH_PREFS_KEY_LINK_CLICK_IDENTIFIER];
}

- (void)setLinkClickIdentifier:(NSString *)linkClickIdentifier {
    [self writeObjectToDefaults:BRANCH_PREFS_KEY_LINK_CLICK_IDENTIFIER value:linkClickIdentifier];
}

- (NSString *)spotlightIdentifier {
    return [self readStringFromDefaults:BRANCH_PREFS_KEY_SPOTLIGHT_IDENTIFIER];
}

- (void)setSpotlightIdentifier:(NSString *)spotlightIdentifier {
    [self writeObjectToDefaults:BRANCH_PREFS_KEY_SPOTLIGHT_IDENTIFIER value:spotlightIdentifier];
}

- (NSString *)externalIntentURI {
    @synchronized(self) {
        if (!_externalIntentURI) {
            _externalIntentURI = [self readStringFromDefaults:BRANCH_REQUEST_KEY_EXTERNAL_INTENT_URI];
        }
        return _externalIntentURI;
    }
}

- (void)setExternalIntentURI:(NSString *)externalIntentURI {
    @synchronized(self) {
        if (externalIntentURI == nil || ![_externalIntentURI isEqualToString:externalIntentURI]) {
            _externalIntentURI = externalIntentURI;
            [self writeObjectToDefaults:BRANCH_REQUEST_KEY_EXTERNAL_INTENT_URI value:externalIntentURI];
        }
    }
}

- (NSString*) referringURL {
    @synchronized (self) {
        if (!_referringURL) _referringURL = [self readStringFromDefaults:@"referringURL"];
        return _referringURL;
    }
}

- (void) setReferringURL:(NSString *)referringURL {
    @synchronized (self) {
        _referringURL = [referringURL copy];
        [self writeObjectToDefaults:@"referringURL" value:_referringURL];
    }
}

- (NSString *)universalLinkUrl {
    return [self readStringFromDefaults:BRANCH_PREFS_KEY_UNIVERSAL_LINK_URL];
}

- (void)setUniversalLinkUrl:(NSString *)universalLinkUrl {
    [self writeObjectToDefaults:BRANCH_PREFS_KEY_UNIVERSAL_LINK_URL value:universalLinkUrl];
}

- (NSString *)sessionParams {
    @synchronized (self) {
        if (!_sessionParams) {
            _sessionParams = [self readStringFromDefaults:BRANCH_PREFS_KEY_SESSION_PARAMS];
        }
        return _sessionParams;
    }
}

- (void)setSessionParams:(NSString *)sessionParams {
    @synchronized (self) {
        if (sessionParams == nil || ![_sessionParams isEqualToString:sessionParams]) {
            _sessionParams = sessionParams;
            [self writeObjectToDefaults:BRANCH_PREFS_KEY_SESSION_PARAMS value:sessionParams];
        }
    }
}

- (NSString *)installParams {
    @synchronized(self) {
        if (!_installParams) {
            id installParamsFromCache = [self readStringFromDefaults:BRANCH_PREFS_KEY_INSTALL_PARAMS];
            if ([installParamsFromCache isKindOfClass:[NSString class]]) {
                _installParams = [self readStringFromDefaults:BRANCH_PREFS_KEY_INSTALL_PARAMS];
            }
            else if ([installParamsFromCache isKindOfClass:[NSDictionary class]]) {
                [self writeObjectToDefaults:BRANCH_PREFS_KEY_INSTALL_PARAMS value:nil];
            }
        }
        return _installParams;
    }
}

- (void)setInstallParams:(NSString *)installParams {
    @synchronized(self) {
        if ([installParams isKindOfClass:[NSDictionary class]]) {
            _installParams = [BNCEncodingUtils encodeDictionaryToJsonString:(NSDictionary *)installParams];
            [self writeObjectToDefaults:BRANCH_PREFS_KEY_INSTALL_PARAMS value:_installParams];
            return;
        }
        if (installParams == nil || ![_installParams isEqualToString:installParams]) {
            _installParams = installParams;
            [self writeObjectToDefaults:BRANCH_PREFS_KEY_INSTALL_PARAMS value:installParams];
        }
    }
}

- (void) setAppleSearchAdDetails:(NSDictionary*)details {
    if (details == nil || [details isKindOfClass:[NSDictionary class]]) {
        _appleSearchAdDetails = details;
        [self writeObjectToDefaults:BRANCH_PREFS_KEY_APPLE_SEARCH_ADS_INFO value:details];
    }
}

- (NSDictionary*) appleSearchAdDetails {
    if (!_appleSearchAdDetails) {
        _appleSearchAdDetails = (NSDictionary *) [self readObjectFromDefaults:BRANCH_PREFS_KEY_APPLE_SEARCH_ADS_INFO];
    }
    return [_appleSearchAdDetails isKindOfClass:[NSDictionary class]] ? _appleSearchAdDetails : nil;
}

- (void) setAppleSearchAdNeedsSend:(BOOL)appleSearchAdNeedsSend {
    [self writeBoolToDefaults:@"_appleSearchAdNeedsSend" value:appleSearchAdNeedsSend];
}

- (BOOL) appleSearchAdNeedsSend {
    return [self readBoolFromDefaults:@"_appleSearchAdNeedsSend"];
}

- (NSString*) lastSystemBuildVersion {
    if (!_lastSystemBuildVersion) {
        _lastSystemBuildVersion = [self readStringFromDefaults:@"_lastSystemBuildVersion"];
    }
    return _lastSystemBuildVersion;
}

- (void) setLastSystemBuildVersion:(NSString *)lastSystemBuildVersion {
    if (![_lastSystemBuildVersion isEqualToString:lastSystemBuildVersion]) {
        _lastSystemBuildVersion = lastSystemBuildVersion;
        [self writeObjectToDefaults:@"_lastSystemBuildVersion" value:_lastSystemBuildVersion];
    }
}

- (NSString*) browserUserAgentString {
    if (!_browserUserAgentString) {
        _browserUserAgentString = [self readStringFromDefaults:@"_browserUserAgentString"];
    }
    return _browserUserAgentString;
}

- (void) setBrowserUserAgentString:(NSString *)browserUserAgentString {
    if (![_browserUserAgentString isEqualToString:browserUserAgentString]) {
        _browserUserAgentString = browserUserAgentString;
        [self writeObjectToDefaults:@"_browserUserAgentString" value:_browserUserAgentString];
    }
}

- (NSString *)userUrl {
    if (!_userUrl) {
        _userUrl = [self readStringFromDefaults:BRANCH_PREFS_KEY_USER_URL];
    }
    
    return _userUrl;
}

- (void)setUserUrl:(NSString *)userUrl {
    if (![_userUrl isEqualToString:userUrl]) {
        _userUrl = userUrl;
        [self writeObjectToDefaults:BRANCH_PREFS_KEY_USER_URL value:userUrl];
    }
}

- (NSMutableString*) sanitizedMutableBaseURL:(NSString*)baseUrl_ {
    NSMutableString *baseUrl = [baseUrl_ mutableCopy];
    if (self.trackingDisabled) {
        NSString *id_string = [NSString stringWithFormat:@"%%24identity_id=%@", self.identityID];
        NSRange range = [baseUrl rangeOfString:id_string];
        if (range.location != NSNotFound) [baseUrl replaceCharactersInRange:range withString:@""];
    } else
    if ([baseUrl hasSuffix:@"&"] || [baseUrl hasSuffix:@"?"]) {
    } else
    if ([baseUrl bnc_containsString:@"?"]) {
        [baseUrl appendString:@"&"];
    }
    else {
        [baseUrl appendString:@"?"];
    }
    return baseUrl;
}

- (BOOL)checkedAppleSearchAdAttribution {
    _checkedAppleSearchAdAttribution = [self readBoolFromDefaults:BRANCH_PREFS_KEY_CHECKED_APPLE_SEARCH_ADS];
    return _checkedAppleSearchAdAttribution;
}

- (void)setCheckedAppleSearchAdAttribution:(BOOL)checked {
    _checkedAppleSearchAdAttribution = checked;
    [self writeBoolToDefaults:BRANCH_PREFS_KEY_CHECKED_APPLE_SEARCH_ADS value:checked];
}


- (BOOL)checkedFacebookAppLinks {
    _checkedFacebookAppLinks = [self readBoolFromDefaults:BRANCH_PREFS_KEY_CHECKED_FACEBOOK_APP_LINKS];
    return _checkedFacebookAppLinks;
}

- (void)setCheckedFacebookAppLinks:(BOOL)checked {
    _checkedFacebookAppLinks = checked;
    [self writeBoolToDefaults:BRANCH_PREFS_KEY_CHECKED_FACEBOOK_APP_LINKS value:checked];
}

- (void)clearUserCreditsAndCounts {
    self.creditsDictionary = [[NSMutableDictionary alloc] init];
}

- (id)getBranchUniversalLinkDomains {
    return [[[NSBundle mainBundle] infoDictionary] objectForKey:BRANCH_PREFS_KEY_BRANCH_UNIVERSAL_LINK_DOMAINS];
}

- (NSMutableDictionary *)requestMetadataDictionary {
    if (!_requestMetadataDictionary) {
        _requestMetadataDictionary = [NSMutableDictionary dictionary];
    }
    return _requestMetadataDictionary;
}

- (void)setRequestMetadataKey:(NSString *)key value:(NSObject *)value {
    if (!key) {
        return;
    }
    if ([self.requestMetadataDictionary objectForKey:key] && !value) {
        [self.requestMetadataDictionary removeObjectForKey:key];
    }
    else if (value) {
        [self.requestMetadataDictionary setObject:value forKey:key];
    }
}

- (NSMutableDictionary *)instrumentationDictionary {
    @synchronized (self) {
        if (!_instrumentationDictionary) {
            _instrumentationDictionary = [NSMutableDictionary dictionary];
        }
        return _instrumentationDictionary;
    }
}

- (void)addInstrumentationDictionaryKey:(NSString *)key value:(NSString *)value {
    @synchronized (self) {
        if (key && value) {
            [self.instrumentationDictionary setObject:value forKey:key];
        }
    }
}

- (void)clearInstrumentationDictionary {
    @synchronized (self) {
        [_instrumentationDictionary removeAllObjects];
    }
}

- (BOOL) limitFacebookTracking {
    @synchronized (self) {
        return [self readBoolFromDefaults:@"_limitFacebookTracking"];
    }
}

- (void) setLimitFacebookTracking:(BOOL)limitFacebookTracking {
    @synchronized (self) {
        [self writeBoolToDefaults:@"_limitFacebookTracking" value:limitFacebookTracking];
    }
}

- (NSDate*) previousAppBuildDate {
    @synchronized (self) {
        NSDate *date = (NSDate*) [self readObjectFromDefaults:@"_previousAppBuildDate"];
        if ([date isKindOfClass:[NSDate class]]) return date;
        return nil;
    }
}

- (void) setPreviousAppBuildDate:(NSDate*)date {
    @synchronized (self) {
        if (date == nil || [date isKindOfClass:[NSDate class]])
            [self writeObjectToDefaults:@"_previousAppBuildDate" value:date];
    }
}

- (NSArray<NSString*>*) URLBlackList {
    @synchronized(self) {
        id a = [self readObjectFromDefaults:@"URLBlackList"];
        if ([a isKindOfClass:NSArray.class]) return a;
        return nil;
    }
}

- (void) setURLBlackList:(NSArray<NSString *> *)URLBlackList {
    @synchronized(self) {
        [self writeObjectToDefaults:@"URLBlackList" value:URLBlackList];
    }
}

- (NSInteger) URLBlackListVersion {
    @synchronized(self) {
        return [self readIntegerFromDefaults:@"URLBlackListVersion"];
    }
}

- (void) setURLBlackListVersion:(NSInteger)URLBlackListVersion {
    @synchronized(self) {
        [self writeIntegerToDefaults:@"URLBlackListVersion" value:URLBlackListVersion];
    }
}

- (BOOL) blacklistURLOpen {
    @synchronized(self) {
        return [self readBoolFromDefaults:@"blacklistURLOpen"];
    }
}

- (void) setBlacklistURLOpen:(BOOL)value {
    @synchronized(self) {
        [self writeBoolToDefaults:@"blacklistURLOpen" value:value];
    }
}


- (BOOL) trackingDisabled {
    @synchronized(self) {
        NSNumber *b = (id) [self readObjectFromDefaults:@"trackingDisabled"];
        if ([b isKindOfClass:NSNumber.class]) return [b boolValue];
        return false;
    }
}

- (void) setTrackingDisabled:(BOOL)disabled {
    @synchronized(self) {
        NSNumber *b = [NSNumber numberWithBool:disabled];
        [self writeObjectToDefaults:@"trackingDisabled" value:b];
        if (disabled) [self clearTrackingInformation];
    }
}

- (void) clearTrackingInformation {
    @synchronized(self) {
        /* Don't clear these:
        self.deviceFingerprintID = nil;
        self.userIdentity = nil;
        self.identityID = nil;
        */
        self.sessionID = nil;
        self.linkClickIdentifier = nil;
        self.spotlightIdentifier = nil;
        self.referringURL = nil;
        self.universalLinkUrl = nil;
        self.installParams = nil;
        self.appleSearchAdDetails = nil;
        self.appleSearchAdNeedsSend = NO;
        self.sessionParams = nil;
        self.externalIntentURI = nil;
        self.savedAnalyticsData = nil;
        self.previousAppBuildDate = nil;
        self.requestMetadataDictionary = nil;
        self.lastStrongMatchDate = nil;
    }
}

#pragma mark - Credit Storage

- (NSMutableDictionary *)creditsDictionary {
    if (!_creditsDictionary) {
        _creditsDictionary = [[self readObjectFromDefaults:BRANCH_PREFS_KEY_CREDITS] mutableCopy];
        
        if (!_creditsDictionary) {
            _creditsDictionary = [[NSMutableDictionary alloc] init];
        }
    }
    
    return _creditsDictionary;
}

- (void)setCreditCount:(NSInteger)count {
    [self setCreditCount:count forBucket:@"default"];
}

- (void)setCreditCount:(NSInteger)count forBucket:(NSString *)bucket {
    self.creditsDictionary[[BRANCH_PREFS_KEY_CREDIT_BASE stringByAppendingString:bucket]] = @(count);

    [self writeObjectToDefaults:BRANCH_PREFS_KEY_CREDITS value:self.creditsDictionary];
}

- (void)removeCreditCountForBucket:(NSString *)bucket {
    NSMutableDictionary *dictToWrite = self.creditsDictionary;
    [dictToWrite removeObjectForKey:[BRANCH_PREFS_KEY_CREDIT_BASE stringByAppendingString:bucket]];

    [self writeObjectToDefaults:BRANCH_PREFS_KEY_CREDITS value:self.creditsDictionary];
}

- (NSDictionary *)getCreditDictionary {
    NSMutableDictionary *returnDictionary = [[NSMutableDictionary alloc] init];
    for(NSString *key in self.creditsDictionary) {
        NSString *cleanKey = [key stringByReplacingOccurrencesOfString:BRANCH_PREFS_KEY_CREDIT_BASE
                                                                                     withString:@""];
        returnDictionary[cleanKey] = self.creditsDictionary[key];
    }
    return returnDictionary;
}

- (NSInteger)getCreditCount {
    return [self getCreditCountForBucket:@"default"];
}

- (NSInteger)getCreditCountForBucket:(NSString *)bucket {
    return [self.creditsDictionary[[BRANCH_PREFS_KEY_CREDIT_BASE stringByAppendingString:bucket]] integerValue];
}

- (void)clearUserCredits {
    self.creditsDictionary = [[NSMutableDictionary alloc] init];
    [self writeObjectToDefaults:BRANCH_PREFS_KEY_CREDITS value:self.creditsDictionary];
}

#pragma mark - Count Storage

- (void)updateBranchViewCount:(NSString *)branchViewID {
    NSInteger currentCount = [self getBranchViewCount:branchViewID] + 1;
    [self writeObjectToDefaults:[BRANCH_PREFS_KEY_BRANCH_VIEW_USAGE_CNT stringByAppendingString:branchViewID] value:@(currentCount)];
}

- (NSInteger)getBranchViewCount:(NSString *)branchViewID {
    NSInteger count = [self readIntegerFromDefaults:[BRANCH_PREFS_KEY_BRANCH_VIEW_USAGE_CNT stringByAppendingString:branchViewID]];
    if (count == NSNotFound){
        count = 0;
    }
    return count;
}

- (void)saveBranchAnalyticsData:(NSDictionary *)analyticsData {
    if (_sessionID) {
        if (!_savedAnalyticsData) {
            _savedAnalyticsData = [self getBranchAnalyticsData];
        }
        NSMutableArray *viewDataArray = [_savedAnalyticsData objectForKey:_sessionID];
        if (!viewDataArray) {
            viewDataArray = [[NSMutableArray alloc] init];
            [_savedAnalyticsData setObject:viewDataArray forKey:_sessionID];
        }
        [viewDataArray addObject:analyticsData];
        [self writeObjectToDefaults:BRANCH_PREFS_KEY_ANALYTICAL_DATA value:_savedAnalyticsData];
    }
}

- (void)clearBranchAnalyticsData {
    [self writeObjectToDefaults:BRANCH_PREFS_KEY_ANALYTICAL_DATA value:nil];
    _savedAnalyticsData = nil;
}

- (NSMutableDictionary *)getBranchAnalyticsData {
    NSMutableDictionary *analyticsDataObj = _savedAnalyticsData;
    if (!analyticsDataObj) {
        analyticsDataObj = (NSMutableDictionary *)[self readObjectFromDefaults:BRANCH_PREFS_KEY_ANALYTICAL_DATA];
        if (!analyticsDataObj) {
            analyticsDataObj = [[NSMutableDictionary alloc] init];
        }
    }
    return analyticsDataObj;
}

- (void)saveContentAnalyticsManifest:(NSDictionary *)cdManifest {
    [self writeObjectToDefaults:BRANCH_PREFS_KEY_ANALYTICS_MANIFEST value:cdManifest];
}

- (NSDictionary *)getContentAnalyticsManifest {
    return (NSDictionary *)[self readObjectFromDefaults:BRANCH_PREFS_KEY_ANALYTICS_MANIFEST];
}

#pragma mark - Writing To Persistence

- (void)writeIntegerToDefaults:(NSString *)key value:(NSInteger)value {
    [self writeObjectToDefaults:key value:@(value)];
}

- (void)writeBoolToDefaults:(NSString *)key value:(BOOL)value {
    [self writeObjectToDefaults:key value:@(value)];
}

- (void)writeObjectToDefaults:(NSString *)key value:(NSObject *)value {
    @synchronized (self) {
        if (value) {
            self.persistenceDict[key] = value;
        }
        else {
            [self.persistenceDict removeObjectForKey:key];
        }
        [self persistPrefsToDisk];
    }
}

- (void)persistPrefsToDisk {
    @synchronized (self) {
        if (!self.persistenceDict) return;
        NSData *data = nil;
        @try {
            data = [NSKeyedArchiver archivedDataWithRootObject:self.persistenceDict];
        }
        @catch (id exception) {
            data = nil;
            BNCLogWarning(@"Exception creating preferences data: %@.", exception);
        }
        if (!data) {
            BNCLogWarning(@"Can't create preferences data.");
            return;
        }
        NSURL *prefsURL = [self.class.URLForPrefsFile copy];
        NSBlockOperation *newPersistOp = [NSBlockOperation blockOperationWithBlock:^ {
            NSError *error = nil;
            [data writeToURL:prefsURL options:NSDataWritingAtomic error:&error];
            if (error) {
                BNCLogWarning(@"Failed to persist preferences: %@.", error);
            }
        }];
        [_persistPrefsQueue addOperation:newPersistOp];
    }
}

+ (void) clearAll {
    NSURL *prefsURL = [self.URLForPrefsFile copy];
    if (prefsURL) [[NSFileManager defaultManager] removeItemAtURL:prefsURL error:nil];
}

#pragma mark - Reading From Persistence

- (NSMutableDictionary *)persistenceDict {
    @synchronized(self) {
        if (!_persistenceDict) {
            NSDictionary *persistenceDict = nil;
            @try {
                NSError *error = nil;
                NSData *data = [NSData dataWithContentsOfURL:self.class.URLForPrefsFile
                    options:0 error:&error];
                if (!error && data)
                    persistenceDict = [NSKeyedUnarchiver unarchiveObjectWithData:data];
            }
            @catch (NSException*) {
                BNCLogWarning(@"Failed to load preferences from storage.");
            }

            if ([persistenceDict isKindOfClass:[NSDictionary class]])
                _persistenceDict = [persistenceDict mutableCopy];
            else
                _persistenceDict = [[NSMutableDictionary alloc] init];
        }
        return _persistenceDict;
    }
}

- (NSObject *)readObjectFromDefaults:(NSString *)key {
    @synchronized(self) {
        NSObject *obj = self.persistenceDict[key];
        return obj;
    }
}

- (NSString *)readStringFromDefaults:(NSString *)key {
    @synchronized(self) {
        id str = self.persistenceDict[key];
        if ([str isKindOfClass:[NSNumber class]]) {
            str = [str stringValue];
        }
        return str;
    }
}

- (BOOL)readBoolFromDefaults:(NSString *)key {
    @synchronized(self) {
        BOOL boo = [self.persistenceDict[key] boolValue];
        return boo;
    }
}

- (NSInteger)readIntegerFromDefaults:(NSString *)key {
    @synchronized(self) {
        NSNumber *number = self.persistenceDict[key];
        if (number != nil) {
            return [number integerValue];
        }
        return NSNotFound;
    }
}

#pragma mark - Preferences File URL

+ (NSString *)prefsFile_deprecated {
    NSString * path =
        [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES)
            firstObject]
                stringByAppendingPathComponent:BRANCH_PREFS_FILE];
    return path;
}

+ (NSURL* _Nonnull) URLForPrefsFile {
    NSURL *URL = BNCURLForBranchDirectory();
    URL = [URL URLByAppendingPathComponent:BRANCH_PREFS_FILE isDirectory:NO];
    return URL;
}

+ (void) moveOldPrefsFile {
    NSString* oldPath = self.prefsFile_deprecated;
    NSURL *oldURL = (oldPath) ? [NSURL fileURLWithPath:self.prefsFile_deprecated] : nil;
    NSURL *newURL = [self URLForPrefsFile];

    if (!oldURL || !newURL) { return; }

    NSError *error = nil;
    [[NSFileManager defaultManager]
        moveItemAtURL:oldURL
        toURL:newURL
        error:&error];

    if (error && error.code != NSFileNoSuchFileError) {
        if (error.code == NSFileWriteFileExistsError) {
            [[NSFileManager defaultManager]
                removeItemAtURL:oldURL
                error:&error];
        } else {
            BNCLogError(@"Can't move prefs file: %@.", error);
        }
    }
}

+ (void) initialize {
    if (self == [BNCPreferenceHelper self]) {
        [self moveOldPrefsFile];
    }
}

@end

#pragma mark - BNCURLForBranchDirectory

NSURL* _Null_unspecified BNCCreateDirectoryForBranchURLWithSearchPath_Unthreaded(NSSearchPathDirectory directory) {
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSArray *URLs = [fileManager URLsForDirectory:directory inDomains:NSUserDomainMask | NSLocalDomainMask];

    for (NSURL *URL in URLs) {
        NSError *error = nil;
        NSURL *branchURL = [[NSURL alloc] initWithString:@"io.branch" relativeToURL:URL];
        BOOL success =
            [fileManager
                createDirectoryAtURL:branchURL
                withIntermediateDirectories:YES
                attributes:nil
                error:&error];
        if (success) {
            return branchURL;
        } else  {
            NSLog(@"[branch.io] Info: CreateBranchURL failed: %@ URL: %@.", error, branchURL);
        }
    }
    return nil;
}

NSURL* _Nonnull BNCURLForBranchDirectory_Unthreaded() {
    NSArray *kSearchDirectories = @[
        @(NSApplicationSupportDirectory),
        @(NSLibraryDirectory),
        @(NSCachesDirectory),
        @(NSDocumentDirectory),
    ];

    for (NSNumber *directory in kSearchDirectories) {
        NSSearchPathDirectory directoryValue = [directory unsignedLongValue];
        NSURL *URL = BNCCreateDirectoryForBranchURLWithSearchPath_Unthreaded(directoryValue);
        if (URL) return URL;
    }

    //  Worst case backup plan:
    NSString *path = [@"~/Library/io.branch" stringByExpandingTildeInPath];
    NSURL *branchURL = [NSURL fileURLWithPath:path isDirectory:YES];
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSError *error = nil;
    BOOL success =
        [fileManager
            createDirectoryAtURL:branchURL
            withIntermediateDirectories:YES
            attributes:nil
            error:&error];
    if (!success) {
        NSLog(@"[io.branch] Error: Worst case CreateBranchURL error was: %@ URL: %@.", error, branchURL);
    }
    return branchURL;
}

NSURL* _Nonnull BNCURLForBranchDirectory() {
    static NSURL *urlForBranchDirectory = nil;
    static dispatch_once_t onceToken = 0;
    dispatch_once(&onceToken, ^ {
        urlForBranchDirectory = BNCURLForBranchDirectory_Unthreaded();
    });
    return urlForBranchDirectory;
}
