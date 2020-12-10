//
//  BNCAppleSearchAds.m
//  Branch
//
//  Created by Ernest Cho on 10/22/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BNCAppleSearchAds.h"
#import "BNCAppleAdClient.h"
#import "NSError+Branch.h"

@interface BNCAppleSearchAds()

// Hide reflection and make testing easier
@property (nonatomic, strong, readwrite) id <BNCAppleAdClientProtocol> adClient;

// Maximum number of tries
@property (nonatomic, assign, readwrite) NSInteger maxAttempts;

// Apple recommends waiting a bit before checking search ads and waiting between retries.
@property (nonatomic, assign, readwrite) NSTimeInterval delay;

// Apple recommends implementing our own timeout per request to Apple Search Ads
@property (nonatomic, assign, readwrite) NSTimeInterval timeOut;

@end

@implementation BNCAppleSearchAds

+ (BNCAppleSearchAds *)sharedInstance {
    static BNCAppleSearchAds *singleton;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        singleton = [[BNCAppleSearchAds alloc] init];
    });
    return singleton;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        self.adClient = [BNCAppleAdClient new];
        
        self.enableAppleSearchAdsCheck = NO;
        self.ignoreAppleTestData = NO;
        [self useDefaultAppleSearchAdsConfig];
    }
    return self;
}

// Default delay and retry configuration.  ~p90
// typically less than 1s delay, up to 3.5s delay on first app start
- (void)useDefaultAppleSearchAdsConfig {
    self.delay = 0.5;
    self.maxAttempts = 1;
    self.timeOut = 3.0;
}

// Apple suggests a longer delay, however this is detrimental to app launch times
// typically less than 1s delay, up to 14s delay on first app start
- (void)useLongWaitAppleSearchAdsConfig {
    self.delay = 2.0;
    self.maxAttempts = 2;
    self.timeOut = 5.0;
}

/*
 Apple recommends retrying the following error codes

 ADClientErrorUnknown = 0
 ADClientErrorMissingData = 2
 ADClientErrorCorruptResponse = 3
 */
- (BOOL)isSearchAdsErrorRetryable:(nullable NSError *)error {
    if (error && (error.code == 0 || error.code == 2 || error.code == 3)) {
        return YES;
    }
    return NO;
}

// Eventually BNCPreferenceHelper should be responsible for correctly storing data
- (void)saveToPreferences:(BNCPreferenceHelper *)preferenceHelper attributionDetails:(nullable NSDictionary *)attributionDetails error:(nullable NSError *)error elapsedSeconds:(NSTimeInterval)elapsedSeconds {
    @synchronized (preferenceHelper) {
        if (attributionDetails.count > 0 && !error) {
            [preferenceHelper addInstrumentationDictionaryKey:@"apple_search_ad" value:[[NSNumber numberWithInteger:elapsedSeconds*1000] stringValue]];
        }
        if (!error) {
            if (attributionDetails == nil) {
                attributionDetails = @{};
            }
            if (preferenceHelper.appleSearchAdDetails == nil) {
                preferenceHelper.appleSearchAdDetails = @{};
            }
            if (![preferenceHelper.appleSearchAdDetails isEqualToDictionary:attributionDetails]) {
                preferenceHelper.appleSearchAdDetails = attributionDetails;
                preferenceHelper.appleSearchAdNeedsSend = YES;
            }
        }
    }
}

- (BOOL)isAppleSearchAdSavedToDictionary:(NSDictionary *)appleSearchAdDetails {
    NSDictionary *tmp = [appleSearchAdDetails objectForKey:@"Version3.1"];
    if (tmp && ([tmp isKindOfClass:NSDictionary.class])) {
        NSNumber *hasAppleSearchAdAttribution = [tmp objectForKey:@"iad-attribution"];
        return [hasAppleSearchAdAttribution boolValue];
    }
    return NO;
}

- (BOOL)isDateWithinWindow:(NSDate *)installDate {
    // install date should NOT be after current date
    NSDate *now = [NSDate date];
    if ([installDate compare:now] == NSOrderedDescending) {
        return NO;
    }
    
    // install date + 30 days should be after current date
    NSDate *installDatePlus30 = [installDate dateByAddingTimeInterval:(30.0*24.0*60.0*60.0)];
    if ([installDatePlus30 compare:now] == NSOrderedDescending) {
        return YES;
    }
    
    return NO;
}

/*
Expected test payload from Apple.

Printing description of attributionDetails:
{
    "Version3.1" =     {
        "iad-adgroup-id" = 1234567890;
        "iad-adgroup-name" = AdGroupName;
        "iad-attribution" = true;
        "iad-campaign-id" = 1234567890;
        "iad-campaign-name" = CampaignName;
        "iad-click-date" = "2019-10-24T00:14:36Z";
        "iad-conversion-date" = "2019-10-24T00:14:36Z";
        "iad-conversion-type" = Download;
        "iad-country-or-region" = US;
        "iad-creativeset-id" = 1234567890;
        "iad-creativeset-name" = CreativeSetName;
        "iad-keyword" = Keyword;
        "iad-keyword-id" = KeywordID;
        "iad-keyword-matchtype" = Broad;
        "iad-lineitem-id" = 1234567890;
        "iad-lineitem-name" = LineName;
        "iad-org-id" = 1234567890;
        "iad-org-name" = OrgName;
        "iad-purchase-date" = "2019-10-24T00:14:36Z";
    };
}
*/
- (BOOL)isAppleTestData:(NSDictionary *)appleSearchAdDetails {
    NSDictionary *tmp = [appleSearchAdDetails objectForKey:@"Version3.1"];
    if ([@"1234567890" isEqualToString:[tmp objectForKey:@"iad-adgroup-id"]] &&
        [@"AdGroupName" isEqualToString:[tmp objectForKey:@"iad-adgroup-name"]] &&
        [@"1234567890" isEqualToString:[tmp objectForKey:@"iad-campaign-id"]] &&
        [@"CampaignName" isEqualToString:[tmp objectForKey:@"iad-campaign-name"]] &&
        [@"1234567890" isEqualToString:[tmp objectForKey:@"iad-org-id"]] &&
        [@"OrgName" isEqualToString:[tmp objectForKey:@"iad-org-name"]]) {
        return YES;
    }
    return NO;
}

// public API.  checks pre-conditions, saves response
- (void)checkAppleSearchAdsSaveTo:(BNCPreferenceHelper *)preferenceHelper installDate:(NSDate *)installDate completion:(void (^_Nullable)(void))completion {
    
    // several conditions where we do not check apple search ads
    if (!self.enableAppleSearchAdsCheck ||
        [self isAppleSearchAdSavedToDictionary:preferenceHelper.appleSearchAdDetails] ||
        ![self isDateWithinWindow:installDate]) {
        
        if (completion) {
            completion();
        }
        return;
    }
    
    [self requestAttributionWithMaxAttempts:self.maxAttempts completion:^(NSDictionary * _Nullable attributionDetails, NSError * _Nullable error, NSTimeInterval elapsedSeconds) {
        
        if (self.ignoreAppleTestData && [self isAppleTestData:attributionDetails]) {
            [self saveToPreferences:preferenceHelper attributionDetails:@{} error:error elapsedSeconds:elapsedSeconds];
        } else {
            [self saveToPreferences:preferenceHelper attributionDetails:attributionDetails error:error elapsedSeconds:elapsedSeconds];
        }

        if (completion) {
            completion();
        }
    }];
}

// handles retry logic, maxAttempts below 1 are ignored
- (void)requestAttributionWithMaxAttempts:(NSInteger)maxAttempts completion:(void (^_Nullable)(NSDictionary *__nullable attributionDetails, NSError *__nullable error, NSTimeInterval elapsedSeconds))completion {
    
    // recursive retry using blocks.  maybe I should have tried to rework this into a loop.
    __block NSInteger attempts = 1;
    
    // define the retry block
    __block void (^retryBlock)(NSDictionary *attrDetails, NSError *error, NSTimeInterval elapsedSeconds);

    // define a weak version of the retry block
    __unsafe_unretained __block void (^weakRetryBlock)(NSDictionary *attrDetails, NSError *error, NSTimeInterval elapsedSeconds);

    // retry block will retry the call to Apple Search Ads using the weak retry block on retryable error
    retryBlock = ^ void(NSDictionary * _Nullable attributionDetails, NSError * _Nullable error, NSTimeInterval elapsedSeconds) {
        if ([self isSearchAdsErrorRetryable:error] && attempts < maxAttempts) {
            attempts++;
            [self requestAttributionWithCompletion:weakRetryBlock];

        } else {
            
            if (completion) {
                completion(attributionDetails, error, elapsedSeconds);
            }
        }
    };
    
    // set the weak retryblock as the retryblock
    weakRetryBlock = retryBlock;
    
    [self requestAttributionWithCompletion:retryBlock];
}

// handles Apple Search Ad attribution request
- (void)requestAttributionWithCompletion:(void (^_Nullable)(NSDictionary *__nullable attributionDetails, NSError *__nullable error, NSTimeInterval elapsedSeconds))completion {
    
    // Apple recommends waiting for a short delay between requests for Search Ads Attribution, even the very first request
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(self.delay * NSEC_PER_SEC)), dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

        // track timeout
        __block BOOL completed = NO;
        __block NSObject *lock = [NSObject new];
        
        // track apple search ads API performance
        __block NSDate *startDate = [NSDate date];
        
        [self.adClient requestAttributionDetailsWithBlock:^(NSDictionary<NSString *,NSObject *> * _Nonnull attributionDetails, NSError * _Nonnull error) {
            
            // skip callback if request already timed out
            @synchronized (lock) {
                if (completed) {
                    return;
                } else {
                    completed = YES;
                }
            }
            
            // callback with Apple Search Ads data
            NSTimeInterval elapsedSeconds = -[startDate timeIntervalSinceNow];
            if (completion) {
                completion(attributionDetails, error, elapsedSeconds);
            }
        }];
        
        // Apple recommends we implement our own timeout, this is racing the call to Apple Search Ads
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(self.timeOut * NSEC_PER_SEC)), dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
            @synchronized (lock) {
                if (completed) {
                    return;
                } else {
                    completed = YES;
                }
            }
            
            NSTimeInterval elapsedSeconds = -[startDate timeIntervalSinceNow];
            if (completion) {
                completion(nil, [NSError branchErrorWithCode:BNCGeneralError localizedMessage:@"AdClient timed out"], elapsedSeconds);
            }
        });
    });
}

@end
