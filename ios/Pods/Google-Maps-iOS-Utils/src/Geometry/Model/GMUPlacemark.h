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

#import "GMUGeometryContainer.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Represents a placemark which is either a Point, LineString, Polygon, or MultiGeometry. Contains
 * the properties and styles of the place.
 */
@interface GMUPlacemark : NSObject<GMUGeometryContainer>

/**
 * The name element of the placemark.
 */
@property(nonatomic, nullable, readonly) NSString *title;

/**
 * The description element of the placemark.
 */
@property(nonatomic, nullable, readonly) NSString *snippet;

/**
 * The StyleUrl element of the placemark; used to reference a style defined in the file.
 */
@property(nonatomic, nullable, readonly) NSString *styleUrl;

/**
 * Initializes a new KMLPlacemark object.
 *
 * @param geometry The geometry of the placemark.
 * @param title The title of the placemark.
 * @param snippet The snippet text of the placemark.
 * @param inlineStyle The inline style of the placemark.
 * @param styleUrl The url to the style of the placemark.
 */
- (instancetype)initWithGeometry:(id<GMUGeometry> _Nullable)geometry
                           title:(NSString *_Nullable)title
                         snippet:(NSString *_Nullable)snippet
                           style:(GMUStyle *_Nullable)style
                        styleUrl:(NSString *_Nullable)styleUrl;

@end

NS_ASSUME_NONNULL_END
