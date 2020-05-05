//
//  GADMobileAds.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GADAudioVideoManager.h>
#import <GoogleMobileAds/GADInitializationStatus.h>
#import <GoogleMobileAds/GADRequestConfiguration.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// A block called with the initialization status when [GADMobileAds startWithCompletionHandler:]
/// completes or times out.
typedef void (^GADInitializationCompletionHandler)(GADInitializationStatus *_Nonnull status);

/// Google Mobile Ads SDK settings.
@interface GADMobileAds : NSObject

/// Returns the shared GADMobileAds instance.
+ (nonnull GADMobileAds *)sharedInstance;

/// Disables automated SDK crash reporting. If not called, the SDK records the original exception
/// handler if available and registers a new exception handler. The new exception handler only
/// reports SDK related exceptions and calls the recorded original exception handler.
+ (void)disableSDKCrashReporting;

/// Disables automated in-app purchase (IAP) reporting. Must be called before or during the call to
/// your application delegate's -application:didFinishLaunchingWithOptions: method. IAP reporting is
/// used to track IAP ad conversions. Don't disable reporting if you use IAP ads.
+ (void)disableAutomatedInAppPurchaseReporting;

/// The application's audio volume. Affects audio volumes of all ads relative to other audio output.
/// Valid ad volume values range from 0.0 (silent) to 1.0 (current device volume). Use this method
/// only if your application has its own volume controls (e.g., custom music or sound effect
/// volumes). Defaults to 1.0.
@property(nonatomic, assign) float applicationVolume;

/// Indicates whether the application's audio is muted. Affects initial mute state for all ads. Use
/// this method only if your application has its own volume controls (e.g., custom music or sound
/// effect muting). Defaults to NO.
@property(nonatomic, assign) BOOL applicationMuted;

/// Manages the Google Mobile Ads SDK's audio and video settings.
@property(nonatomic, readonly, strong, nonnull) GADAudioVideoManager *audioVideoManager;

/// Request configuration that is common to all requests.
@property(nonatomic, readonly, strong, nonnull) GADRequestConfiguration *requestConfiguration;

/// Initialization status of the ad networks available to the Google Mobile Ads SDK.
@property(nonatomic, nonnull, readonly) GADInitializationStatus *initializationStatus;

/// Returns YES if the current SDK version is at least |major|.|minor|.|patch|. This method can be
/// used by libraries that depend on a specific minimum version of the Google Mobile Ads SDK to warn
/// developers if they have an incompatible version.
///
/// Available in Google Mobile Ads SDK 7.10 and onwards. Before calling this method check if the
/// GADMobileAds's shared instance responds to this method. Calling this method on a Google Mobile
/// Ads SDK lower than 7.10 can crash the app.
- (BOOL)isSDKVersionAtLeastMajor:(NSInteger)major minor:(NSInteger)minor patch:(NSInteger)patch;

/// Starts the Google Mobile Ads SDK. Call this method as early as possible to reduce latency on the
/// session's first ad request. Calls completionHandler when the GMA SDK and all mediation networks
/// are fully set up or if set-up times out. The Google Mobile Ads SDK starts on the first ad
/// request if this method is not called.
- (void)startWithCompletionHandler:(nullable GADInitializationCompletionHandler)completionHandler;

/// Disables automated in-app purchase (IAP) reporting. Must be called before or during the call to
/// your application delegate's -application:didFinishLaunchingWithOptions: method. IAP reporting is
/// used to track IAP ad conversions. Don't disable reporting if you use IAP ads.
- (void)disableAutomatedInAppPurchaseReporting;

/// Enables automated in-app purchase (IAP) reporting. IAP reporting is used to track IAP ad
/// conversions.
- (void)enableAutomatedInAppPurchaseReporting;

#pragma mark Deprecated

/// Configures the SDK using the settings associated with the given application ID.
+ (void)configureWithApplicationID:(nonnull NSString *)applicationID
    GAD_DEPRECATED_MSG_ATTRIBUTE("Use -[GADMobileAds.sharedInstance startWithCompletionHandler:]");

@end
