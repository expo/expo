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

NS_ASSUME_NONNULL_BEGIN

@protocol GMUGeometryContainer;

/**
 * Instances of this class parse GeoJSON data. The parsed features are stored in NSArray objects
 * which can then be passed to a GMUGeometryRenderer to display on a Google Map.
 */
@interface GMUGeoJSONParser : NSObject

/**
 * The features parsed from the GeoJSON file.
 */
@property(nonatomic, readonly) NSArray<id<GMUGeometryContainer>> *features;

/**
 * Initializes a GMUGeoJSONParser with GeoJSON data contained in a URL.
 *
 * @param url The url containing GeoJSON data.
 */
- (instancetype)initWithURL:(NSURL *)url;

/**
 * Initializes a GMUGeoJSONParser with GeoJSON data.
 *
 * @param data The GeoJSON data.
 */
- (instancetype)initWithData:(NSData *)data;

/**
 * Initializes a GMUGeoJSONParser with GeoJSON data contained in an input stream.
 *
 * @param stream The stream to use to access GeoJSON data.
 */
- (instancetype)initWithStream:(NSInputStream *)stream;

/**
 * Parses the stored GeoJSON data.
 */
- (void)parse;

@end

NS_ASSUME_NONNULL_END
