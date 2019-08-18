/* Copyright (c) 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIColor.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Instances of this class represent a geometry Style. It is used to define the
 * stylings of any number of GMUGeometry objects.
 */
@interface GMUStyle : NSObject

/**
 * The unique identifier of the style
 */
@property(nonatomic, readonly) NSString *styleID;

/**
 * The color for the stroke of a LineString or Polygon.
 */
@property(nonatomic, nullable, readonly) UIColor *strokeColor;

/**
 * The color for the fill of a Polygon.
 */
@property(nonatomic, nullable, readonly) UIColor *fillColor;

/**
 * The width of a LineString
 */
@property(nonatomic, readonly) CGFloat width;

/**
 * The scale that a Point's icon should be rendered at.
 */
@property(nonatomic, readonly) CGFloat scale;

/**
 * The direction, in degrees, that a Point's icon should be rendered at.
 */
@property(nonatomic, readonly) CGFloat heading;

/**
 * The position within an icon that is anchored to the Point.
 */
@property(nonatomic, readonly) CGPoint anchor;

/**
 * The href for the icon to be used for a Point.
 */
@property(nonatomic, nullable, readonly) NSString *iconUrl;

/**
 * The title to use for a Point.
 */
@property(nonatomic, nullable, readonly) NSString *title;

/**
 * Whether the Polygon has a defined fill color.
 */
@property(nonatomic, readonly) BOOL hasFill;

/**
 * Whether the LineString or Polygon has a defined stroke color.
 */
@property(nonatomic, readonly) BOOL hasStroke;

/**
 * Initalizer that defines the style's identifier.
 *
 * @param styleID The unique identifier string for the style.
 * @param strokeColor The color of the geometry stroke.
 * @param fillColor The color of the geometry fill.
 * @param width The width of the geometry stroke.
 * @param scale The scale at which point icons will be rendered
 * @param heading The heading of the point icon.
 * @param anchor The anchor coordinate of the point icon.
 * @param iconUrl The reference url to the point icon image.
 * @param title The title of the point.
 * @param hasFill Whether the geometry should be filled.
 * @param hasStroke Whether the geometry has a stroke.
 */
- (instancetype)initWithStyleID:(NSString *)styleID
                    strokeColor:(UIColor *_Nullable)strokeColor
                      fillColor:(UIColor *_Nullable)fillColor
                          width:(CGFloat)width
                          scale:(CGFloat)scale
                        heading:(CGFloat)heading
                         anchor:(CGPoint)anchor
                        iconUrl:(NSString *_Nullable)iconUrl
                          title:(NSString *_Nullable)title
                        hasFill:(BOOL)hasFill
                      hasStroke:(BOOL)hasStroke;

@end

NS_ASSUME_NONNULL_END
