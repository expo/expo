//
//  GMSStrokeStyle.h
//  Google Maps SDK for iOS
//
//  Copyright 2019 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/** Describes the drawing style for one-dimensional entities such as polylines. */
@interface GMSStrokeStyle : NSObject

/** Creates a solid color stroke style. */
+ (instancetype)solidColor:(UIColor *)color;

/** Creates a gradient stroke style interpolating from |fromColor| to |toColor|. */
+ (instancetype)gradientFromColor:(UIColor *)fromColor toColor:(UIColor *)toColor;

@end

NS_ASSUME_NONNULL_END
