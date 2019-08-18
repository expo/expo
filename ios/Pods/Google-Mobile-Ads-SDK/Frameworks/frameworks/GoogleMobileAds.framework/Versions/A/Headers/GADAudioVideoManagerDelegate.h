//
//  GADAudioVideoManagerDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2016 Google Inc. All rights reserved.
//

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADAudioVideoManager;

GAD_ASSUME_NONNULL_BEGIN

@protocol GADAudioVideoManagerDelegate<NSObject>

@optional

/// Tells the delegate that the Google Mobile Ads SDK will start playing a video. This method isn't
/// called if another video rendered by Google Mobile Ads SDK is already playing.
- (void)audioVideoManagerWillPlayVideo:(GADAudioVideoManager *)audioVideoManager;

/// Tells the delegate that the Google Mobile Ads SDK has paused/stopped all video playback.
- (void)audioVideoManagerDidPauseAllVideo:(GADAudioVideoManager *)audioVideoManager;

/// Tells the delegate that at least one video rendered by the Google Mobile Ads SDK will play
/// sound. Your app should stop playing sound when this method is called.
- (void)audioVideoManagerWillPlayAudio:(GADAudioVideoManager *)audioVideoManager;

/// Tells the delegate that all the video rendered by the Google Mobile Ads SDK has stopped playing
/// sound. Your app can now resume any music playback or produce any kind of sound. Note that this
/// message doesn't mean that all the video has stopped playing, just audio, so you shouldn't
/// deactivate AVAudioSession's instance. Doing so can lead to unexpected video playback behavior.
/// You may deactivate AVAudioSession only when all rendered video ads are paused or have finished
/// playing, and 'audioVideoDidPauseAllVideo:' is called.
- (void)audioVideoManagerDidStopPlayingAudio:(GADAudioVideoManager *)audioVideoManager;

@end

GAD_ASSUME_NONNULL_END
