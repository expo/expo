//
//  GADUnifiedNativeAd+CustomClickGesture.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADUnifiedNativeAd.h>

@interface GADUnifiedNativeAd (CustomClickGesture)

/// Indicates whether the custom click gestures feature can be used.
@property(nonatomic, readonly, getter=isCustomClickGestureEnabled) BOOL customClickGestureEnabled;

/// Enables custom click gestures. Must be called before the ad is associated with an ad view.
/// Available for whitelisted accounts only.
- (void)enableCustomClickGestures;

/// Records a click triggered by a custom click gesture.
- (void)recordCustomClickGesture;

@end
