//
//  GMSStyleSpan.h
//  Google Maps SDK for iOS
//
//  Copyright 2019 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <UIKit/UIKit.h>

#import "GMSStrokeStyle.h"

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

NS_ASSUME_NONNULL_END
