//
//  GADVideoOptions.h
//  Google Mobile Ads SDK
//
//  Copyright 2016 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADAdLoader.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// Video ad options.
@interface GADVideoOptions : GADAdLoaderOptions

/// Indicates whether videos should start muted. By default this property value is YES.
@property(nonatomic, assign) BOOL startMuted;

/// Indicates whether the requested video should have custom controls enabled for
/// play/pause/mute/unmute.
@property(nonatomic, assign) BOOL customControlsRequested;

/// Indicates whether the requested video should have the click to expand behavior.
@property(nonatomic, assign) BOOL clickToExpandRequested;

@end
