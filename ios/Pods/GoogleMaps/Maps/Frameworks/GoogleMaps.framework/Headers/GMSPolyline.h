//
//  GMSPolyline.h
//  Google Maps SDK for iOS
//
//  Copyright 2012 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <UIKit/UIKit.h>

#import "GMSOverlay.h"
#import "GMSStrokeStyle.h"

@class GMSPath;

NS_ASSUME_NONNULL_BEGIN

/** Describes the style for some region of a polyline. */
@interface GMSStyleSpan : NSObject

/**
 * Factory returning a solid color span of length one segment. Equivalent to
 * [GMSStyleSpan spanWithStyle:[GMSStrokeStyle solidColor:|color|] segments:1].
 */
+ (instancetype)spanWithColor:(UIColor *)color;

/**
 * Factory returning a solid color span with a given number of segments. Equivalent to
 * [GMSStyleSpan spanWithStyle:[GMSStrokeStyle solidColor:|color|] segments:|segments|].
 */
+ (instancetype)spanWithColor:(UIColor *)color segments:(double)segments;

/**
 * Factory returning a span with the given |style| of length one segment. Equivalent to
 * [GMSStyleSpan spanWithStyle:|style| segments:1].
 */
+ (instancetype)spanWithStyle:(GMSStrokeStyle *)style;

/**
 * Factory returning a span with the given |style| and length in number of segments.
 * |segments| must be greater than 0 (i.e. can't be 0).
 */
+ (instancetype)spanWithStyle:(GMSStrokeStyle *)style segments:(double)segments;

/** The style of this span. */
@property(nonatomic, readonly) GMSStrokeStyle *style;

/** The length of this span in number of segments. */
@property(nonatomic, readonly) double segments;

@end

/**
 * GMSPolyline specifies the available options for a polyline that exists on the Earth's surface.
 * It is drawn as a physical line between the points specified in |path|.
 */
@interface GMSPolyline : GMSOverlay

/**
 * The path that describes this polyline.
 */
@property(nonatomic, copy, nullable) GMSPath *path;

/**
 * The width of the line in screen points. Defaults to 1.
 */
@property(nonatomic, assign) CGFloat strokeWidth;

/**
 * The UIColor used to render the polyline. Defaults to [UIColor blueColor].
 */
@property(nonatomic, strong) UIColor *strokeColor;

/** Whether this line should be rendered with geodesic correction. */
@property(nonatomic, assign) BOOL geodesic;

/**
 * Convenience constructor for GMSPolyline for a particular path. Other properties will have
 * default values.
 */
+ (instancetype)polylineWithPath:(nullable GMSPath *)path;

/**
 * An array containing GMSStyleSpan, the spans used to render this polyline.
 *
 * If this array contains fewer segments than the polyline itself, the final segment will be applied
 * over the remaining length. If this array is unset or empty, then |strokeColor| is used for the
 * entire line instead.
 */
@property(nonatomic, copy, nullable) NSArray<GMSStyleSpan *> *spans;

@end

NS_ASSUME_NONNULL_END
