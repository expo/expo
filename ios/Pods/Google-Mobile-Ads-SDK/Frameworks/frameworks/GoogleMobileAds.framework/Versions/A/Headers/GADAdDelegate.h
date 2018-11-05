//
//  GADAdDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

#pragma mark - Audio Control Notifications

/// Delegate methods common to multiple ad types.
@protocol GADAdDelegate<NSObject>

@optional

#pragma mark Audio Control Methods

/// Asks the delegate if the audio session category can be changed while displaying an ad. Return NO
/// to prevent the Google Mobile Ads SDK from changing the audio session category. The default
/// behavior if unimplemented is to return YES.
- (BOOL)ad:(id)ad shouldChangeAudioSessionToCategory:(NSString *)audioSessionCategory;

@end

GAD_ASSUME_NONNULL_END
