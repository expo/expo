//
//  GADMobileAds.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GADAudioVideoManager.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Google Mobile Ads SDK settings.
@interface GADMobileAds : NSObject

/// Returns the shared GADMobileAds instance.
+ (GADMobileAds *)sharedInstance;

/// Configures the SDK using the settings associated with the given application ID.
+ (void)configureWithApplicationID:(NSString *)applicationID;

/// Disables automated in app purchase (IAP) reporting. Must be called before any IAP transaction is
/// initiated. IAP reporting is used to track IAP ad conversions. Do not disable reporting if you
/// use IAP ads.
+ (void)disableAutomatedInAppPurchaseReporting;

/// Disables automated SDK crash reporting. If not called, the SDK records the original exception
/// handler if available and registers a new exception handler. The new exception handler only
/// reports SDK related exceptions and calls the recorded original exception handler.
+ (void)disableSDKCrashReporting;

/// The application's audio volume. Affects audio volumes of all ads relative to other audio output.
/// Valid ad volume values range from 0.0 (silent) to 1.0 (current device volume). Use this method
/// only if your application has its own volume controls (e.g., custom music or sound effect
/// volumes). Defaults to 1.0.
@property(nonatomic, assign) float applicationVolume;

/// Indicates if the application's audio is muted. Affects initial mute state for all ads. Use this
/// method only if your application has its own volume controls (e.g., custom music or sound effect
/// muting). Defaults to NO.
@property(nonatomic, assign) BOOL applicationMuted;

/// Manages the Google Mobile Ads SDK's audio and video settings.
@property(nonatomic, readonly, strong) GADAudioVideoManager *audioVideoManager;

/// Returns YES if the current SDK version is at least |major|.|minor|.|patch|. This method can be
/// used by libraries that depend on a specific minimum version of the Google Mobile Ads SDK to warn
/// developers if they have an incompatible version.
///
/// Available in Google Mobile Ads SDK 7.10 and onwards. Before calling this method check if the
/// GADMobileAds's shared instance responds to this method. Calling this method on a Google Mobile
/// Ads SDK lower than 7.10 can crash the app.
- (BOOL)isSDKVersionAtLeastMajor:(NSInteger)major minor:(NSInteger)minor patch:(NSInteger)patch;

@end

GAD_ASSUME_NONNULL_END
