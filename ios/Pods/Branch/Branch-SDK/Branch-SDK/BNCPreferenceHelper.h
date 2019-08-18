//
//  BNCPreferenceHelper.h
//  Branch-SDK
//
//  Created by Alex Austin on 6/6/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

#define FILE_NAME   [[NSString stringWithUTF8String:__FILE__] lastPathComponent]
#define LINE_NUM    __LINE__

NSURL* /* _Nonnull */ BNCURLForBranchDirectory(void);

@interface BNCPreferenceHelper : NSObject

@property (strong, nonatomic) NSString *lastRunBranchKey;
@property (strong, nonatomic) NSDate   *lastStrongMatchDate;
@property (strong, nonatomic) NSString *appVersion;
@property (strong, nonatomic) NSString *deviceFingerprintID;
@property (strong, nonatomic) NSString *sessionID;
@property (strong, nonatomic) NSString *identityID;
@property (strong, nonatomic) NSString *linkClickIdentifier;
@property (strong, nonatomic) NSString *spotlightIdentifier;
@property (strong, atomic)    NSString *universalLinkUrl;
@property (strong, nonatomic) NSString *userUrl;
@property (strong, nonatomic) NSString *userIdentity;
@property (strong, nonatomic) NSString *sessionParams;
@property (strong, nonatomic) NSString *installParams;
@property (assign, nonatomic) BOOL isDebug;
@property (assign, nonatomic) BOOL shouldWaitForInit;
@property (assign, nonatomic) BOOL checkedFacebookAppLinks;
@property (assign, nonatomic) BOOL checkedAppleSearchAdAttribution;
@property (assign, nonatomic) NSInteger retryCount;
@property (assign, nonatomic) NSTimeInterval retryInterval;
@property (assign, nonatomic) NSTimeInterval timeout;
@property (strong, atomic)    NSString *externalIntentURI;
@property (strong, nonatomic) NSMutableDictionary *savedAnalyticsData;
@property (assign, nonatomic) NSInteger installRequestDelay;
@property (strong, nonatomic) NSDictionary *appleSearchAdDetails;
@property (assign, nonatomic) BOOL          appleSearchAdNeedsSend;
@property (strong, nonatomic) NSString *lastSystemBuildVersion;
@property (strong, nonatomic) NSString *browserUserAgentString;
@property (strong, atomic) NSString *referringURL;
@property (strong, atomic) NSString *branchAPIURL;
@property (assign, atomic) BOOL      limitFacebookTracking;
@property (strong, atomic) NSDate   *previousAppBuildDate;

@property (strong, atomic) NSArray<NSString*> *URLBlackList;
@property (assign, atomic) NSInteger URLBlackListVersion;
@property (assign, atomic) BOOL blacklistURLOpen;

@property (assign, atomic) BOOL trackingDisabled;
- (void) clearTrackingInformation;

+ (BNCPreferenceHelper *)preferenceHelper;

- (NSString *)getAPIBaseURL;
- (NSString *)getAPIURL:(NSString *)endpoint;
- (NSString *)getEndpointFromURL:(NSString *)url;

- (void)clearUserCreditsAndCounts;
- (void)clearUserCredits;

- (id)getBranchUniversalLinkDomains;

- (void)setCreditCount:(NSInteger)count;
- (void)setCreditCount:(NSInteger)count forBucket:(NSString *)bucket;
- (void)removeCreditCountForBucket:(NSString *)bucket;
- (NSDictionary *)getCreditDictionary;
- (NSInteger)getCreditCount;
- (NSInteger)getCreditCountForBucket:(NSString *)bucket;

- (void)updateBranchViewCount:(NSString *)branchViewID;
- (NSInteger)getBranchViewCount:(NSString *)branchViewID;

- (void)setRequestMetadataKey:(NSString *)key value:(NSObject *)value;
- (NSMutableDictionary *)requestMetadataDictionary;

- (void)addInstrumentationDictionaryKey:(NSString *)key value:(NSString *)value;
- (NSMutableDictionary *)instrumentationDictionary;
- (void)clearInstrumentationDictionary;

- (void)saveBranchAnalyticsData:(NSDictionary *)analyticsData;
- (void)clearBranchAnalyticsData;
- (NSMutableDictionary *)getBranchAnalyticsData;
- (NSDictionary *)getContentAnalyticsManifest;
- (void)saveContentAnalyticsManifest:(NSDictionary *)cdManifest;

- (NSMutableString*) sanitizedMutableBaseURL:(NSString*)baseUrl;
- (void) synchronize;  //  Flushes preference queue to persistence.
+ (void) clearAll;

@end
