//
//  GADNativeAdImage+Mediation.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google. All rights reserved.
//

#import <GoogleMobileAds/GADNativeAdImage.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Provides additional GADNativeAdImage initializers.
@interface GADNativeAdImage (MediationAdditions)

/// Initializes and returns a native ad image object with the provided image.
- (instancetype)initWithImage:(UIImage *)image;

/// Initializes and returns a native ad image object with the provided image URL and image scale.
- (instancetype)initWithURL:(NSURL *)URL scale:(CGFloat)scale;

@end

GAD_ASSUME_NONNULL_END
