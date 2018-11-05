//
//  GADSearchRequest.h
//  Google Mobile Ads SDK
//
//  Copyright 2011 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Search ad border types.
typedef NS_ENUM(NSUInteger, GADSearchBorderType) {
  kGADSearchBorderTypeNone,    ///< No border.
  kGADSearchBorderTypeDashed,  ///< Dashed line border.
  kGADSearchBorderTypeDotted,  ///< Dotted line border.
  kGADSearchBorderTypeSolid    ///< Solid line border.
};

/// Search ad call button color types.
typedef NS_ENUM(NSUInteger, GADSearchCallButtonColor) {
  kGADSearchCallButtonLight,   ///< Light button color.
  kGADSearchCallButtonMedium,  ///< Medium button color.
  kGADSearchCallButtonDark     ///< Dark button color.
};

/// Specifies parameters for search ads.
@interface GADSearchRequest : GADRequest

/// The search ad query.
@property(nonatomic, copy, GAD_NULLABLE) NSString *query;
/// The search ad background color.
@property(nonatomic, readonly, copy, GAD_NULLABLE) UIColor *backgroundColor;
/// The search ad gradient "from" color.
@property(nonatomic, readonly, copy, GAD_NULLABLE) UIColor *gradientFrom;
/// The search ad gradient "to" color.
@property(nonatomic, readonly, copy, GAD_NULLABLE) UIColor *gradientTo;
/// The search ad header color.
@property(nonatomic, copy, GAD_NULLABLE) UIColor *headerColor;
/// The search ad description text color.
@property(nonatomic, copy, GAD_NULLABLE) UIColor *descriptionTextColor;
/// The search ad anchor text color.
@property(nonatomic, copy, GAD_NULLABLE) UIColor *anchorTextColor;
/// The search ad text font family.
@property(nonatomic, copy, GAD_NULLABLE) NSString *fontFamily;
/// The search ad header text size.
@property(nonatomic, assign) NSUInteger headerTextSize;
/// The search ad border color.
@property(nonatomic, copy, GAD_NULLABLE) UIColor *borderColor;
/// The search ad border type.
@property(nonatomic, assign) GADSearchBorderType borderType;
/// The search ad border thickness.
@property(nonatomic, assign) NSUInteger borderThickness;
/// The search ad custom channels.
@property(nonatomic, copy, GAD_NULLABLE) NSString *customChannels;
/// The search ad call button color.
@property(nonatomic, assign) GADSearchCallButtonColor callButtonColor;

/// A solid background color for rendering the ad. The background of the ad
/// can either be a solid color, or a gradient, which can be specified through
/// setBackgroundGradientFrom:toColor: method. If both solid and gradient
/// background is requested, only the latter is considered.
- (void)setBackgroundSolid:(UIColor *)color;

/// A linear gradient background color for rendering the ad. The background of
/// the ad can either be a linear gradient, or a solid color, which can be
/// specified through setBackgroundSolid method. If both solid and gradient
/// background is requested, only the latter is considered.
- (void)setBackgroundGradientFrom:(UIColor *)from toColor:(UIColor *)toColor;

@end

GAD_ASSUME_NONNULL_END
