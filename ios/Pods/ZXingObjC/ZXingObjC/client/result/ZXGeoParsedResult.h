/*
 * Copyright 2012 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "ZXParsedResult.h"

@interface ZXGeoParsedResult : ZXParsedResult

/**
 * @return latitude in degrees
 */
@property (nonatomic, assign, readonly) double latitude;

/**
 * @return longitude in degrees
 */
@property (nonatomic, assign, readonly) double longitude;

/**
 * @return altitude in meters. If not specified, in the geo URI, returns 0.0
 */
@property (nonatomic, assign, readonly) double altitude;

/**
 * @return query string associated with geo URI or null if none exists
 */
@property (nonatomic, copy, readonly) NSString *query;

- (id)initWithLatitude:(double)latitude longitude:(double)longitude altitude:(double)altitude query:(NSString *)query;
+ (id)geoParsedResultWithLatitude:(double)latitude longitude:(double)longitude altitude:(double)altitude query:(NSString *)query;
- (NSString *)geoURI;

@end
