//
//  GADVideoOptions.h
//  Google Mobile Ads SDK
//
//  Copyright 2016 Google Inc. All rights reserved.
//

#import <GoogleMobileAds/GADAdLoader.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Video ad options.
@interface GADVideoOptions : GADAdLoaderOptions

/// Indicates if videos should start muted. By default this property value is YES.
@property(nonatomic, assign) BOOL startMuted;

/// Indicates if the requested video should have custom controls enabled for play/pause/mute/unmute.
@property(nonatomic, assign) BOOL customControlsRequested;

@end

GAD_ASSUME_NONNULL_END
