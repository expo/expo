//
//  GADMEnums.h
//  Google Mobile Ads SDK
//
//  Copyright 2011 Google. All rights reserved.
//

#import <Foundation/Foundation.h>

/// These are the types of animation we employ for transitions between two mediated ads.
typedef NS_ENUM(NSInteger, GADMBannerAnimationType) {
  kGADMBannerAnimationTypeNone = 0,            ///< No animation.
  kGADMBannerAnimationTypeFlipFromLeft = 1,    ///< Flip from left.
  kGADMBannerAnimationTypeFlipFromRight = 2,   ///< Flip from right.
  kGADMBannerAnimationTypeCurlUp = 3,          ///< Curl up.
  kGADMBannerAnimationTypeCurlDown = 4,        ///< Curl down.
  kGADMBannerAnimationTypeSlideFromLeft = 5,   ///< Slide from left.
  kGADMBannerAnimationTypeSlideFromRight = 6,  ///< Slide from right.
  kGADMBannerAnimationTypeFadeIn = 7,          ///< Fade in.
  kGADMBannerAnimationTypeRandom = 8,          ///< Random animation.
};
