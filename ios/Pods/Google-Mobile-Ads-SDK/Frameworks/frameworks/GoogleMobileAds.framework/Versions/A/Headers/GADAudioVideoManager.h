//
//  GADAudioVideoManager.h
//  Google Mobile Ads SDK
//
//  Copyright 2016 Google Inc. All rights reserved.
//

#import <GoogleMobileAds/GADAudioVideoManagerDelegate.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Provides audio and video notifications and configurations management. Available only on iOS 7
/// and above.
///
/// Don't create an instance of this class and use the one available from GADMobileAds
/// sharedInstace's audioVideoManager.
@interface GADAudioVideoManager : NSObject

/// Delegate for receiving video and audio updates.
@property(nonatomic, weak, nullable) id<GADAudioVideoManagerDelegate> delegate;

/// Indicates whether the application wishes to manage audio session. If set as YES, the Google
/// Mobile Ads SDK will stop managing AVAudioSession during the video playback lifecycle. If set as
/// NO, the Google Mobile Ads SDK will control AVAudioSession. That may include: setting
/// AVAudioSession's category to AVAudioSessionCategoryAmbient when all videos are muted, setting
/// AVAudioSession's category to AVAudioSessionCategorySoloAmbient when any playing video becomes
/// unmuted, and allowing background apps to continue playing sound when all videos rendered by
/// Google Mobile Ads SDK are muted or have stopped playing.
@property(nonatomic, assign) BOOL audioSessionIsApplicationManaged;

@end

GAD_ASSUME_NONNULL_END
