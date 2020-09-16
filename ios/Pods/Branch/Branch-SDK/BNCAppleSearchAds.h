//
//  BNCAppleSearchAds.h
//  Branch
//
//  Created by Ernest Cho on 10/22/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "BNCPreferenceHelper.h"

NS_ASSUME_NONNULL_BEGIN

@interface BNCAppleSearchAds : NSObject

@property (nonatomic, assign, readwrite) BOOL enableAppleSearchAdsCheck;
@property (nonatomic, assign, readwrite) BOOL ignoreAppleTestData;

+ (BNCAppleSearchAds *)sharedInstance;

// Default delay and retry configuration.  ~p90
// typically less than 1s delay, up to 3.5s delay on first app start
- (void)useDefaultAppleSearchAdsConfig;

// Apple suggests a longer delay, however this is detrimental to app launch times
// typically less than 3s delay, up to 14s delay on first app start
- (void)useLongWaitAppleSearchAdsConfig;

// Checks Apple Search Ads and updates preferences
// This method blocks the thread, it should only be called on a background thread.
- (void)checkAppleSearchAdsSaveTo:(BNCPreferenceHelper *)preferenceHelper installDate:(NSDate *)installDate completion:(void (^_Nullable)(void))completion;

@end

NS_ASSUME_NONNULL_END
