//
//  GADNativeAdImage+Mediation.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google. All rights reserved.
//

#import <GoogleMobileAds/GADNativeAdImage.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// Provides additional GADNativeAdImage initializers.
@interface GADNativeAdImage (MediationAdditions)

/// Initializes and returns a native ad image object with the provided image.
- (nonnull instancetype)initWithImage:(nonnull UIImage *)image;

/// Initializes and returns a native ad image object with the provided image URL and image scale.
- (nonnull instancetype)initWithURL:(nonnull NSURL *)URL scale:(CGFloat)scale;

@end
