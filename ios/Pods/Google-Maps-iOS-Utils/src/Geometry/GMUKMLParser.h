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
#import <CoreLocation/CoreLocation.h>

#import <GoogleMaps/GoogleMaps.h>

NS_ASSUME_NONNULL_BEGIN

@class GMUStyle;
@protocol GMUGeometryContainer;

/**
 * Instances of this class parse KML documents in an event-driven manner. The
 * parsed placemarks and styles are stored in NSArray objects which can then be
 * passed to a GMUGeometryRenderer to display on a Google Map.
 */
@interface GMUKMLParser : NSObject

/**
 * The placemarks parsed from the KML file.
 */
@property(nonatomic, readonly) NSArray<id<GMUGeometryContainer>> *placemarks;

/**
 * The styles parsed from the KML file.
 */
@property(nonatomic, readonly) NSArray<GMUStyle *> *styles;

/**
 * Parses the stored KML document.
 */
- (void)parse;

/**
 * Initializes a KMLParser with a KML file contained in a URL.
 *
 * @param url The url containing the KML file.
 */
- (instancetype)initWithURL:(NSURL *)url;

/**
 * Initializes a KMLParser with a KML file contained in a data file.
 *
 * @param data The data file containing the contents of a KML file.
 */
- (instancetype)initWithData:(NSData *)data;

/**
 * Initializes a KMLParser with a KML file contained in an input stream.
 *
 * @param stream The stream to use to access the KML file.
 */
- (instancetype)initWithStream:(NSInputStream *)stream;

@end

NS_ASSUME_NONNULL_END
