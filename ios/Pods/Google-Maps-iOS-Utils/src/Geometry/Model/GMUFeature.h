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

#import <GoogleMaps/GoogleMaps.h>

#import "GMUGeometryContainer.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Instances of this class represent a GeoJSON Feature object.
 */
@interface GMUFeature : NSObject<GMUGeometryContainer>

/**
 * The identifier of the feature.
 */
@property(nonatomic, nullable, readonly) NSString *identifier;

/**
 * The properties of the geometry in the feature.
 */
@property(nonatomic, nullable, readonly) NSDictionary<NSString *, NSString *> *properties;

/**
 * The bounding box of the geometry in the feature.
 */
@property(nonatomic, nullable, readonly) GMSCoordinateBounds *boundingBox;

/**
 *
 * @param geometry The geometry object in the feature.
 * @param identifier The identifier of the feature.
 * @param properties The properties of the geometry in the feature.
 * @param boundingBox The bounding box of the geometry in the feature.
 */
- (instancetype)initWithGeometry:(id<GMUGeometry>)geometry
                      identifier:(NSString * _Nullable)identifier
                      properties:(NSDictionary<NSString *, NSString *> * _Nullable)properties
                     boundingBox:(GMSCoordinateBounds * _Nullable)boundingBox;

@end

NS_ASSUME_NONNULL_END
