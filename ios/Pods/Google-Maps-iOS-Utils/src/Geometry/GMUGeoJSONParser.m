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

#import "GMUGeoJSONParser.h"

#import <CoreLocation/CoreLocation.h>

#import <GoogleMaps/GoogleMaps.h>

#import "GMUFeature.h"
#import "GMUGeometryCollection.h"
#import "GMULineString.h"
#import "GMUPoint.h"
#import "GMUPolygon.h"

static NSString *const kGMUTypeMember = @"type";
static NSString *const kGMUIdMember = @"id";
static NSString *const kGMUGeometryMember = @"geometry";
static NSString *const kGMUGeometriesMember = @"geometries";
static NSString *const kGMUPropertiesMember = @"properties";
static NSString *const kGMUBoundingBoxMember = @"bbox";
static NSString *const kGMUCoordinatesMember = @"coordinates";
static NSString *const kGMUFeaturesMember = @"features";
static NSString *const kGMUFeatureValue = @"Feature";
static NSString *const kGMUFeatureCollectionValue = @"FeatureCollection";
static NSString *const kGMUPointValue = @"Point";
static NSString *const kGMUMultiPointValue = @"MultiPoint";
static NSString *const kGMULineStringValue = @"LineString";
static NSString *const kGMUMultiLineStringValue = @"MultiLineString";
static NSString *const kGMUPolygonValue = @"Polygon";
static NSString *const kGMUMultiPolygonValue = @"MultiPolygon";
static NSString *const kGMUGeometryCollectionValue = @"GeometryCollection";
static NSString *const kGMUGeometryRegex =
    @"^(Point|MultiPoint|LineString|MultiLineString|Polygon|MultiPolygon|GeometryCollection)$";

@implementation GMUGeoJSONParser {
  /**
   * The data object containing the GeoJSON to be parsed.
   */
  NSData *_data;

  /**
   * The stream containing the GeoJSON to be parsed.
   */
  NSInputStream *_stream;

  /**
   * The parsed GeoJSON file.
   */
  NSDictionary *_JSONDict;

  /**
   * The list of parsed Features.
   */
  NSMutableArray<GMUFeature *> *_features;

  /**
   * The bounding box for a FeatureCollection. This will only be set when parsing a
   * FeatureCollection.
   */
  GMSCoordinateBounds *_boundingBox;

  /**
   * The format that a geometry element may take.
   */
  NSRegularExpression *_geometryRegex;

  /**
   * The format that a multigeometry element may take.
   */
  NSRegularExpression *_multiGeometryRegex;

  /**
   * Whether the parser has completed parsing the input file.
   */
  BOOL _isParsed;
}

- (instancetype)initWithData:(NSData *)data {
  if (self = [super init]) {
    _data = data;
    [self sharedInit];
  }
  return self;
}

- (instancetype)initWithStream:(NSInputStream *)stream {
  if (self = [super init]) {
    _stream = stream;
    [self sharedInit];
  }
  return self;
}

- (instancetype)initWithURL:(NSURL *)url {
  if (self = [super init]) {
    _data = [[NSData alloc] initWithContentsOfURL:url];
    [self sharedInit];
  }
  return self;
}

- (void)sharedInit {
  _features = [[NSMutableArray alloc] init];
  _geometryRegex = [NSRegularExpression regularExpressionWithPattern:kGMUGeometryRegex
                                                             options:0
                                                               error:nil];
}

- (NSArray<GMUFeature *> *)features {
  return _features;
}

- (void)parse {
  if (_isParsed) {
    return;
  }
  if (_data) {
    _JSONDict = [NSJSONSerialization JSONObjectWithData:_data options:0 error:nil];
  } else if (_stream) {
    [_stream open];
    _JSONDict = [NSJSONSerialization JSONObjectWithStream:_stream options:0 error:nil];
    [_stream close];
  }
  if (!_JSONDict || ![_JSONDict isKindOfClass:[NSDictionary class]]) {
    return;
  }
  NSString *type = [_JSONDict objectForKey:kGMUTypeMember];
  if (type == nil) {
    return;
  }
  GMUFeature *feature;
  if ([type isEqual:kGMUFeatureValue]) {
    feature = [self featureFromDict:_JSONDict];
    if (feature) {
      [_features addObject:feature];
    }
  } else if ([type isEqual:kGMUFeatureCollectionValue]) {
    NSArray<GMUFeature *> *featureCollection = [self featureCollectionFromDict:_JSONDict];
    if (featureCollection) {
      [_features addObjectsFromArray:featureCollection];
    }
  } else if ([_geometryRegex firstMatchInString:type
                                        options:0
                                          range:NSMakeRange(0, [type length])]) {
    feature = [self featureFromGeometryDict:_JSONDict];
    if (feature) {
      [_features addObject:feature];
    }
  }
  _isParsed = true;
}

- (GMUFeature *)featureFromDict:(NSDictionary *)feature {
  id<GMUGeometry> geometry;
  NSString *identifier = [feature objectForKey:kGMUIdMember];
  GMSCoordinateBounds *boundingBox;
  NSDictionary *properties = [feature objectForKey:kGMUPropertiesMember];
  if ([feature objectForKey:kGMUGeometryMember]) {
    geometry = [self geometryFromDict:[feature objectForKey:kGMUGeometryMember]];
  }
  if (_boundingBox) {
    boundingBox = _boundingBox;
  } else if ([feature objectForKey:kGMUBoundingBoxMember]) {
    boundingBox = [self boundingBoxFromCoordinates:[feature objectForKey:kGMUBoundingBoxMember]];
  }
  return [[GMUFeature alloc] initWithGeometry:geometry
                                   identifier:identifier
                                   properties:properties
                                  boundingBox:boundingBox];
}

- (NSArray<GMUFeature *> *)featureCollectionFromDict:(NSDictionary *)features {
  NSMutableArray<GMUFeature *> *parsedFeatures = [[NSMutableArray alloc] init];
  if ([features objectForKey:kGMUBoundingBoxMember]) {
    _boundingBox = [self boundingBoxFromCoordinates:[features objectForKey:kGMUBoundingBoxMember]];
  }
  NSArray<NSDictionary *> *geoJSONFeatures = [features objectForKey:kGMUFeaturesMember];
  for (NSDictionary *feature in geoJSONFeatures) {
    if ([[feature objectForKey:kGMUTypeMember] isEqual:kGMUFeatureValue]) {
      GMUFeature *parsedFeature = [self featureFromDict:feature];
      if (parsedFeature) {
        [parsedFeatures addObject:parsedFeature];
      }
    }
  }
  return parsedFeatures;
}

/**
 * Creates a GMSCoordinateBounds object from a set of coordinates.
 *
 * @param coordinates: The coordinates for the bounding box in the order west, south, east, north.
 * @return A bounding box with the specified coordinates.
 */
- (GMSCoordinateBounds *)boundingBoxFromCoordinates:(NSArray *)coordinates {
  CLLocationCoordinate2D southWest =
      CLLocationCoordinate2DMake([coordinates[1] doubleValue], [coordinates[0] doubleValue]);
  CLLocationCoordinate2D northEast =
      CLLocationCoordinate2DMake([coordinates[3] doubleValue], [coordinates[2] doubleValue]);
  return [[GMSCoordinateBounds alloc] initWithCoordinate:northEast coordinate:southWest];
}

- (id<GMUGeometry>)geometryFromDict:(NSDictionary *)dict {
  NSString *geometryType = [dict objectForKey:kGMUTypeMember];
  NSArray *geometryArray;
  if ([geometryType isEqual:kGMUGeometryCollectionValue]) {
    geometryArray = [dict objectForKey:kGMUGeometriesMember];
  } else if ([geometryType isEqual:kGMUGeometriesMember]) {
    geometryArray = [dict objectForKey:kGMUGeometryCollectionValue];
  } else if ([_geometryRegex firstMatchInString:geometryType
                                        options:0
                                          range:NSMakeRange(0, [geometryType length])]) {
    geometryArray = [dict objectForKey:kGMUCoordinatesMember];
  } else {
    return nil;
  }
  return [self geometryWithGeometryType:geometryType geometryArray:geometryArray];
}

- (GMUFeature *)featureFromGeometryDict:(NSDictionary *)JSONGeometry {
  id<GMUGeometry> geometry = [self geometryFromDict:JSONGeometry];
  if (geometry) {
    return [[GMUFeature alloc] initWithGeometry:geometry
                                            identifier:nil
                                            properties:nil
                                           boundingBox:nil];
  }
  return nil;
}

- (id<GMUGeometry>)geometryWithGeometryType:(NSString *)geometryType
                              geometryArray:(NSArray *)geometryArray {
  if ([geometryType isEqual:kGMUPointValue]) {
    return [self pointWithCoordinate:geometryArray];
  } else if ([geometryType isEqual:kGMUMultiPointValue]) {
    return [self multiPointWithCoordinates:geometryArray];
  } else if ([geometryType isEqual:kGMULineStringValue]) {
    return [self lineStringWithCoordinates:geometryArray];
  } else if ([geometryType isEqual:kGMUMultiLineStringValue]) {
    return [self multiLineStringWithCoordinates:geometryArray];
  } else if ([geometryType isEqual:kGMUPolygonValue]) {
    return [self polygonWithCoordinates:geometryArray];
  } else if ([geometryType isEqual:kGMUMultiPolygonValue]) {
    return [self multiPolygonWithCoordinates:geometryArray];
  } else if ([geometryType isEqual:kGMUGeometryCollectionValue]) {
    return [self geometryCollectionWithGeometries:geometryArray];
  }
  return nil;
}

- (GMUPoint *)pointWithCoordinate:(NSArray *)coordinate {
  return [[GMUPoint alloc] initWithCoordinate:[self locationFromCoordinate:coordinate].coordinate];
}

- (GMUGeometryCollection *)multiPointWithCoordinates:(NSArray *)coordinates {
  NSMutableArray<GMUPoint *> *points = [[NSMutableArray alloc] init];
  for (NSArray *coordinate in coordinates) {
    [points addObject:[self pointWithCoordinate:coordinate]];
  }
  return [[GMUGeometryCollection alloc] initWithGeometries:points];
}

- (GMULineString *)lineStringWithCoordinates:(NSArray *)coordinates {
  GMSPath *path = [self pathFromCoordinateArray:coordinates];
  return [[GMULineString alloc] initWithPath:path];
}

- (GMUGeometryCollection *)multiLineStringWithCoordinates:(NSArray *)coordinates {
  NSMutableArray<GMULineString *> *lineStrings = [[NSMutableArray alloc] init];
  for (NSArray *coordinate in coordinates) {
    [lineStrings addObject:[self lineStringWithCoordinates:coordinate]];
  }
  return [[GMUGeometryCollection alloc] initWithGeometries:lineStrings];
}

- (GMUPolygon *)polygonWithCoordinates:(NSArray *)coordinates {
  NSArray<GMSPath *> *pathArray = [self pathArrayFromCoordinateArrays:coordinates];
  return [[GMUPolygon alloc] initWithPaths:pathArray];
}

- (GMUGeometryCollection *)multiPolygonWithCoordinates:(NSArray *)coordinates {
  NSMutableArray<GMUPolygon *> *polygons = [[NSMutableArray alloc] init];
  for (NSArray *coordinate in coordinates) {
    [polygons addObject:[self polygonWithCoordinates:coordinate]];
  }
  return [[GMUGeometryCollection alloc] initWithGeometries:polygons];
}

- (GMUGeometryCollection *)geometryCollectionWithGeometries:(NSArray<NSDictionary *> *)geometries {
  NSMutableArray<GMUGeometry> *elements = [[NSMutableArray<GMUGeometry> alloc] init];
  for (NSDictionary *geometry in geometries) {
    id<GMUGeometry> parsedGeometry = [self geometryFromDict:geometry];
    if (parsedGeometry) {
      [elements addObject:parsedGeometry];
    }
  }
  return [[GMUGeometryCollection alloc] initWithGeometries:elements];
}

- (CLLocation *)locationFromCoordinate:(NSArray *)coordinate {
  return [[CLLocation alloc] initWithLatitude:[coordinate[1] doubleValue]
                                    longitude:[coordinate[0] doubleValue]];
}

- (GMSPath *)pathFromCoordinateArray:(NSArray<NSArray *> *)coordinates {
  GMSMutablePath *path = [[GMSMutablePath alloc] init];
  for (NSArray *coordinate in coordinates) {
    [path addCoordinate:[self locationFromCoordinate:coordinate].coordinate];
  }
  return path;
}

- (NSArray<GMSPath *> *)pathArrayFromCoordinateArrays:(NSArray<NSArray *> *)coordinates {
  NSMutableArray<GMSPath *> *parsedPaths = [[NSMutableArray alloc] init];
  for (NSArray<NSArray *> *coordinateArray in coordinates) {
    [parsedPaths addObject:[self pathFromCoordinateArray:coordinateArray]];
  }
  return parsedPaths;
}

@end
