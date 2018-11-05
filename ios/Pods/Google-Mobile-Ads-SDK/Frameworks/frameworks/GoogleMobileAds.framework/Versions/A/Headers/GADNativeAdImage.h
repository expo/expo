//
//  GADNativeAdImage.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Native ad image.
@interface GADNativeAdImage : NSObject

/// The image. If image autoloading is disabled, this property will be nil.
@property(nonatomic, readonly, strong, GAD_NULLABLE) UIImage *image;

/// The image's URL.
@property(nonatomic, readonly, copy) NSURL *imageURL;

/// The image's scale.
@property(nonatomic, readonly, assign) CGFloat scale;

@end

GAD_ASSUME_NONNULL_END
