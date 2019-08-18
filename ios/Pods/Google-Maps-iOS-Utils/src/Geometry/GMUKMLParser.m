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

#import "GMUKMLParser.h"

#import "GMUGeometry.h"
#import "GMUGeometryCollection.h"
#import "GMUGroundOverlay.h"
#import "GMULineString.h"
#import "GMUPlacemark.h"
#import "GMUPoint.h"
#import "GMUPolygon.h"
#import "GMUStyle.h"

static NSString *const kGMUPlacemarkElementName = @"Placemark";
static NSString *const kGMUGroundOverlayElementName = @"GroundOverlay";
static NSString *const kGMUStyleElementName = @"Style";
static NSString *const kGMULineStyleElementName = @"LineStyle";
static NSString *const kGMUPointElementName = @"Point";
static NSString *const kGMULineStringElementName = @"LineString";
static NSString *const kGMUPolygonElementName = @"Polygon";
static NSString *const kGMUMultiGeometryElementName = @"MultiGeometry";
static NSString *const kGMUInnerBoundariesAttributeName = @"innerBoundaries";
static NSString *const kGMUOuterBoundariesAttributeName = @"outerBoundaries";
static NSString *const kGMUHotspotElementName = @"hotSpot";
static NSString *const kGMUCoordinatesElementName= @"coordinates";
static NSString *const kGMURandomAttributeValue = @"random";
static NSString *const kGMUFractionAttributeValue = @"fraction";
static NSString *const kGMUNameElementName = @"name";
static NSString *const kGMUDescriptionElementName = @"description";
static NSString *const kGMURotationElementName = @"rotation";
static NSString *const kGMUStyleUrlElementName = @"styleUrl";
static NSString *const kGMUDrawOrderElementName = @"drawOrder";
static NSString *const kGMUNorthElementName = @"north";
static NSString *const kGMUEastElementName = @"east";
static NSString *const kGMUSouthElementName = @"south";
static NSString *const kGMUWestElementName = @"west";
static NSString *const kGMUZIndexElementName = @"ZIndex";
static NSString *const kGMUHrefElementName = @"href";
static NSString *const kGMUTextElementName = @"text";
static NSString *const kGMUScaleElementName = @"scale";
static NSString *const kGMUXAttributeName = @"x";
static NSString *const kGMUYAttributeName = @"y";
static NSString *const kGMUXUnitsElementName = @"xunits";
static NSString *const kGMUYUnitsElementName = @"yunits";
static NSString *const kGMUIdAttributeName = @"id";
static NSString *const kGMUOuterBoundaryIsElementName = @"outerBoundaryIs";
static NSString *const kGMUHeadingElementName = @"heading";
static NSString *const kGMUFillElementName = @"fill";
static NSString *const kGMUOutlineElementName = @"outline";
static NSString *const kGMUWidthElementName = @"width";
static NSString *const kGMUColorElementName = @"color";
static NSString *const kGMUColorModeElementName = @"colorMode";
static NSString *const kGMUGeometryRegex = @"^(Point|LineString|Polygon|MultiGeometry)$";
static NSString *const kGMUGeometryAttributeRegex =
    @"^(coordinates|name|description|rotation|drawOrder|href|styleUrl)$";
static NSString *const kGMUCompassRegex = @"^(north|east|south|west)$";
static NSString *const kGMUBoundaryRegex = @"^(outerBoundaryIs|innerBoundaryIs)$";
static NSString *const kGMUStyleRegex = @"^(Style|LineStyle)$";
static NSString *const kGMUStyleAttributeRegex =
    @"^(text|scale|heading|fill|outline|width|color|colorMode)$";
static NSString *const kGMUStyleUrlRegex = @"#.+";

/**
 * Stores the current state of the parser with regards to the type of KML node that is being
 * processed.
 */
typedef NS_OPTIONS(NSUInteger, GMUParserState) {
  kGMUParserStatePlacemark = 1 << 0,
  kGMUParserStateOuterBoundary = 1 << 1,
  kGMUParserStateMultiGeometry = 1 << 2,
  kGMUParserStateStyle = 1 << 3,
  kGMUParserStateLineStyle = 1 << 4,
  kGMUParserStateLeafNode = 1 << 5,
};

@interface GMUKMLParser () <NSXMLParserDelegate>

@end

@implementation GMUKMLParser {
  /**
   * The XML parser used to read the specified document.
   */
  NSXMLParser *_parser;

  /**
   * The format that a geometry element may take.
   */
  NSRegularExpression *_geometryRegex;

  /**
   * The format that a compass coordinate element may take.
   */
  NSRegularExpression *_compassRegex;

  /**
   * The format that a boundary element may take.
   */
  NSRegularExpression *_boundaryRegex;

  /**
   * The format that a style element may take.
   */
  NSRegularExpression *_styleRegex;

  /**
   * The format that a style attribute element may take.
   */
  NSRegularExpression *_styleAttributeRegex;

  /**
   * The format that a style url element may take.
   */
  NSRegularExpression *_styleUrlRegex;

  /**
   * The format that a geometry attribute element may take.
   */
  NSRegularExpression *_geometryAttributeRegex;

  /**
   * The list of placemarks that have been parsed.
   */
  NSMutableArray<GMUPlacemark *> *_placemarks;

  /**
   * The list of styles that have been parsed.
   */
  NSMutableArray<GMUStyle *> *_styles;

  /**
   * The characters contained within the element being parsed.
   */
  NSMutableString *_characters;

  /**
   * The properties to be propagated into the KMLPlacemark object being parsed.
   */
  id<GMUGeometry> _geometry;
  NSMutableArray<id<GMUGeometry>> *_geometries;
  NSString *_title;
  NSString *_snippet;
  GMUStyle *_inlineStyle;
  NSString *_styleUrl;

  /**
   * The properties to be propagated into the KMLStyle object being parsed.
   */
  NSString *_styleID;
  UIColor *_strokeColor;
  UIColor *_fillColor;
  CGFloat _width;
  CGFloat _scale;
  CGFloat _heading;
  CGPoint _anchor;
  NSString *_strokeColorMode;
  NSString *_fillColorMode;
  NSString *_iconUrl;
  NSString *_styleTitle;
  BOOL _hasFill;
  BOOL _hasStroke;

  /**
   * The properties to be propagated into the KMLElement object being parsed.
   */
  NSMutableDictionary *_attributes;
  NSString *_geometryType;

  /**
   * The current state of the parser.
   */
  GMUParserState _parserState;
}

- (instancetype)initWithParser:(NSXMLParser*)parser {
  if (self = [super init]) {
    _parser = parser;
    _placemarks = [[NSMutableArray alloc] init];
    _styles = [[NSMutableArray alloc] init];
    _geometries = [[NSMutableArray alloc] init];
    _attributes = [[NSMutableDictionary alloc] init];

    _geometryRegex = [NSRegularExpression regularExpressionWithPattern:kGMUGeometryRegex
                                                               options:0
                                                                 error:nil];
    _compassRegex = [NSRegularExpression regularExpressionWithPattern:kGMUCompassRegex
                                                              options:0
                                                                error:nil];
    _boundaryRegex = [NSRegularExpression regularExpressionWithPattern:kGMUBoundaryRegex
                                                               options:0
                                                                 error:nil];
    _styleRegex = [NSRegularExpression regularExpressionWithPattern:kGMUStyleRegex
                                                            options:0
                                                              error:nil];
    _styleAttributeRegex = [NSRegularExpression regularExpressionWithPattern:kGMUStyleAttributeRegex
                                                                     options:0
                                                                       error:nil];
    _geometryAttributeRegex =
        [NSRegularExpression regularExpressionWithPattern:kGMUGeometryAttributeRegex
                                                  options:0
                                                    error:nil];
    _styleUrlRegex = [NSRegularExpression regularExpressionWithPattern:kGMUStyleUrlRegex
                                                               options:0
                                                                 error:nil];
    _hasFill = YES;
    _hasStroke = YES;
    [_parser setDelegate:self];
  }
  return self;
}

- (instancetype)initWithURL:(NSURL *)url {
  return [self initWithParser:[[NSXMLParser alloc] initWithContentsOfURL:url]];
}

- (instancetype)initWithData:(NSData *)data {
  return [self initWithParser:[[NSXMLParser alloc] initWithData:data]];
}

- (instancetype)initWithStream:(NSInputStream *)stream {
  return [self initWithParser:[[NSXMLParser alloc] initWithStream:stream]];
}

- (NSArray<GMUPlacemark *> *)placemarks {
  return _placemarks;
}

- (NSArray<GMUStyle *> *)styles {
  return _styles;
}

- (void)parse {
  [_parser parse];
}

- (BOOL)isParsing:(GMUParserState)state {
  return state & _parserState;
}

- (CLLocation *)locationFromString:(NSString *)string {
  NSString *trimmedString =
    [string stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  NSArray *coordinateStrings = [trimmedString componentsSeparatedByString:@","];
  CLLocationDegrees longitude = [coordinateStrings[0] doubleValue];
  CLLocationDegrees latitude = [coordinateStrings[1] doubleValue];

  return [[CLLocation alloc] initWithLatitude:latitude longitude:longitude];
}

- (GMSPath *)pathFromString:(NSString *)string {
  NSCharacterSet *characterSet = [NSCharacterSet whitespaceAndNewlineCharacterSet];
  NSString *coordinateStrings =
      [string stringByReplacingOccurrencesOfString:@"\\s+"
                                        withString:@" "
                                           options:NSRegularExpressionSearch
                                             range:NSMakeRange(0, string.length)];
  NSString *trimmed = [coordinateStrings stringByTrimmingCharactersInSet:characterSet];
  NSArray *coordinateArray = [trimmed componentsSeparatedByCharactersInSet:characterSet];
  GMSMutablePath *path = [[GMSMutablePath alloc] init];
  for (NSString *str in coordinateArray) {
    [path addCoordinate:[self locationFromString:str].coordinate];
  }
  return path;
}

- (UIColor *)colorFromString:(NSString *)string {
  unsigned long long color;
  NSScanner *scanner = [NSScanner scannerWithString:string];
  [scanner scanHexLongLong:&color];
  CGFloat alpha = ((CGFloat) ((color >> 24) & 0xff)) / 255;
  CGFloat blue = ((CGFloat) ((color >> 16) & 0xff)) / 255;
  CGFloat green = ((CGFloat) ((color >> 8) & 0xff)) / 255;
  CGFloat red = ((CGFloat) (color & 0xff)) / 255;
  return [UIColor colorWithRed:red green:green blue:blue alpha:alpha];
}

/**
 * Generates a random color by applying a random linear scale to each color component, ranging from
 * 0x00 to the maximum values specified for each component. The alpha component of the input color
 * is never randomized.
 *
 * @param color The color range to generate random values between.
 * @return The randomly generated color.
 */
- (UIColor *)randomColorFromColor:(UIColor *)color {
  CGFloat red, green, blue, alpha;
  [color getRed:&red green:&green blue:&blue alpha:&alpha];
  red = ((CGFloat)arc4random_uniform((int)(red * 255))) / 255.0;
  green = ((CGFloat)arc4random_uniform((int)(green * 255))) / 255.0;
  blue = ((CGFloat)arc4random_uniform((int)(blue * 255))) / 255.0;
  return [UIColor colorWithRed:red green:green blue:blue alpha:alpha];
}

- (void)parseBeginLeafNode {
  _parserState |= kGMUParserStateLeafNode;
}

- (void)parseBeginHotspotWithAttributes:(NSDictionary *)attributeDict {
  double x = 0.0;
  double y = 0.0;
  BOOL isValidHotspot = YES;
  if ([[attributeDict objectForKey:kGMUXUnitsElementName] isEqual:kGMUFractionAttributeValue]) {
    x = [[attributeDict objectForKey:kGMUXAttributeName] doubleValue];
  } else {
    isValidHotspot = NO;
  }
  if ([[attributeDict objectForKey:kGMUYUnitsElementName] isEqual:kGMUFractionAttributeValue]) {
    y = [[attributeDict objectForKey:kGMUYAttributeName] doubleValue];
  } else {
    isValidHotspot = NO;
  }
  _anchor = isValidHotspot ? CGPointMake(x, y) : CGPointMake(0.5f, 1.0f);
}

- (void)parseBeginBoundaryWithElementName:(NSString *)elementName {
  if([elementName isEqual:kGMUOuterBoundaryIsElementName]) {
    _parserState |= kGMUParserStateOuterBoundary;
  } else {
    _parserState &= ~kGMUParserStateOuterBoundary;
  }
}

- (void)parseBeginStyleWithElementName:(NSString *)elementName
                               styleID:(NSString *)styleID {
  if ([elementName isEqual:kGMUStyleElementName]) {
    _styleID = [NSString stringWithFormat:@"#%@", styleID];
    _parserState |= kGMUParserStateStyle;
  } else if ([elementName isEqual:kGMULineStyleElementName]) {
    _parserState |= kGMUParserStateLineStyle;
  }
}

- (void)parseEndStyle {
  if ([self isParsing:kGMUParserStateLineStyle]) {
    _parserState &= ~kGMUParserStateLineStyle;
  } else {
    _parserState &= ~kGMUParserStateStyle;
    if ([_fillColorMode isEqual:kGMURandomAttributeValue]) {
      _fillColor = [self randomColorFromColor:_fillColor];
    }
    if ([_strokeColorMode isEqual:kGMURandomAttributeValue]) {
      _strokeColor = [self randomColorFromColor:_strokeColor];
    }
    GMUStyle *style = [[GMUStyle alloc] initWithStyleID:_styleID
                                            strokeColor:_strokeColor
                                              fillColor:_fillColor
                                                  width:_width
                                                  scale:_scale
                                                heading:_heading
                                                 anchor:_anchor
                                                iconUrl:_iconUrl
                                                  title:_styleTitle
                                                hasFill:_hasFill
                                              hasStroke:_hasStroke];
    _styleID = nil;
    _strokeColor = nil;
    _fillColor = nil;
    _width = 0;
    _scale = 0;
    _heading = 0;
    _anchor = CGPointZero;
    _iconUrl = nil;
    _styleTitle = nil;
    _hasFill = YES;
    _hasStroke = YES;

    // A style embedded in a Placemark is guaranteed to be an inline style.
    if ([self isParsing:kGMUParserStatePlacemark]) {
      _inlineStyle = style;
    } else {
      [_styles addObject:style];
    }
  }
}

- (void)parseEndStyleAttribute:(NSString *)attribute {
  if ([attribute isEqual:kGMUTextElementName]) {
    _styleTitle = [_characters copy];
  } else if ([attribute isEqual:kGMUScaleElementName]) {
    _scale = [_characters floatValue];
  } else if ([attribute isEqual:kGMUHeadingElementName]) {
    _heading = [_characters floatValue];
  } else if ([attribute isEqual:kGMUFillElementName]) {
    _hasFill = [_characters boolValue];
  } else if ([attribute isEqual:kGMUOutlineElementName]) {
    _hasStroke = [_characters boolValue];
  } else if ([attribute isEqual:kGMUWidthElementName]) {
    _width = [_characters floatValue];
  } else if ([attribute isEqual:kGMUColorElementName]) {
    if ([self isParsing:kGMUParserStateLineStyle]) {
      _strokeColor = [self colorFromString:_characters];
    } else {
      _fillColor = [self colorFromString:_characters];
    }
  } else if ([attribute isEqual:kGMUColorModeElementName]) {
    if ([self isParsing:kGMUParserStateLineStyle]) {
      _strokeColorMode = [_characters copy];
    } else {
      _fillColorMode = [_characters copy];
    }
  }
}

- (void)parseBeginPlacemark {
  _parserState |= kGMUParserStatePlacemark;
}

- (void)parseEndPlacemark {
  _parserState &= ~kGMUParserStatePlacemark;
  [_placemarks addObject:[[GMUPlacemark alloc] initWithGeometry:_geometry
                                                          title:_title
                                                        snippet:_snippet
                                                          style:_inlineStyle
                                                       styleUrl:_styleUrl]];
  _geometryType = nil;
  _attributes = [[NSMutableDictionary alloc] init];
  _geometry = nil;
  _geometries = [[NSMutableArray alloc] init];
  _title = nil;
  _snippet = nil;
  _inlineStyle = nil;
  _styleUrl = nil;
}

- (void)parseEndGroundOverlay {
  CLLocationCoordinate2D northEast =
      CLLocationCoordinate2DMake([[_attributes objectForKey:kGMUNorthElementName] doubleValue],
                                 [[_attributes objectForKey:kGMUEastElementName] doubleValue]);
  CLLocationCoordinate2D southWest =
      CLLocationCoordinate2DMake([[_attributes objectForKey:kGMUSouthElementName] doubleValue],
                                 [[_attributes objectForKey:kGMUWestElementName] doubleValue]);
  int zIndex = [[_attributes objectForKey:kGMUZIndexElementName] intValue];
  double rotation = [[_attributes objectForKey:kGMURotationElementName] doubleValue];
  NSString *href = [_attributes objectForKey:kGMUHrefElementName];
  _geometry = [[GMUGroundOverlay alloc] initWithCoordinate:northEast
                                                 southWest:southWest
                                                    zIndex:zIndex
                                                  rotation:rotation
                                                      href:href];
  [self parseEndPlacemark];
}

- (void)parseBeginGeometryWithElementName:(NSString *)elementName {
  if ([elementName isEqual:kGMUMultiGeometryElementName]) {
    _parserState |= kGMUParserStateMultiGeometry;
  } else {
    _geometryType = elementName;
  }
}

- (void)parseEndGeometryWithElementName:(NSString *)elementName {
  if ([elementName isEqual:kGMUMultiGeometryElementName]) {
    _parserState &= ~kGMUParserStateMultiGeometry;
    _geometry = [[GMUGeometryCollection alloc] initWithGeometries:_geometries];
  } else {
    if ([elementName isEqual:kGMUPointElementName]) {
      CLLocation *coordinate = [_attributes objectForKey:kGMUCoordinatesElementName];
      _geometry = [[GMUPoint alloc] initWithCoordinate:coordinate.coordinate];
    } else if ([elementName isEqual:kGMULineStringElementName]) {
      GMSPath *path = [_attributes objectForKey:kGMUCoordinatesElementName];
      _geometry = [[GMULineString alloc] initWithPath:path];
    } else if ([elementName isEqual:kGMUPolygonElementName]) {
      GMSPath *outerBoundaries = [_attributes objectForKey:kGMUOuterBoundariesAttributeName];
      NSMutableArray<GMSPath *> *paths = [NSMutableArray arrayWithObject:outerBoundaries];
      NSArray<GMSPath *> *holes = [_attributes objectForKey:kGMUInnerBoundariesAttributeName];
      for (GMSPath *hole in holes) {
        [paths addObject:hole];
      }
      _geometry = [[GMUPolygon alloc] initWithPaths:paths];
    }
    if ([self isParsing:kGMUParserStateMultiGeometry]) {
      [_geometries addObject:_geometry];
      _geometry = nil;
      _attributes = [[NSMutableDictionary alloc] init];
    }
  }
}

- (void)parseEndGeometryAttribute:(NSString *)attribute {
  if ([attribute isEqual:kGMUCoordinatesElementName]) {
    [self parseEndCoordinates];
  } else if ([attribute isEqual:kGMUNameElementName]) {
    _title = [_characters copy];
  } else if ([attribute isEqual:kGMUDescriptionElementName]) {
    _snippet = [_characters copy];
  } else if ([attribute isEqual:kGMURotationElementName]) {
    [self parseEndRotation];
  } else if ([attribute isEqual:kGMUDrawOrderElementName]) {
    [_attributes setObject:@([_characters intValue])
                    forKey:kGMUZIndexElementName];
  } else if ([attribute isEqual:kGMUHrefElementName]) {
    if ([self isParsing:kGMUParserStateStyle]) {
      _iconUrl = [_characters copy];
    } else {
      [_attributes setObject:[_characters copy] forKey:attribute];
    }
  } else if ([attribute isEqual:kGMUStyleUrlElementName]) {
    if ([_styleUrlRegex firstMatchInString:_characters
                                   options:0
                                     range:NSMakeRange(0, [_characters length])]) {
      _styleUrl = [_characters copy];
    }
  }
}

- (void)parseEndCompassAttribute:(NSString *)attribute {
  NSNumber *value = [[NSNumber alloc] initWithDouble:[_characters doubleValue]];
  [_attributes setObject:value forKey:attribute];
}

- (void)parseEndRotation {
  double rotation = [_characters doubleValue];

  // Handle invalid rotation inputs.
  if (rotation > 180 || rotation < -180) {
    rotation = 0;
  }

  // Maps from [-180, 180] where the value is an angle in degrees counterclockwise starting from
  // north to [0, 360] clockwise starting from north.
  if (rotation <= 0) {
    rotation = -rotation;
  } else {
    rotation = 360 - rotation;
  }
  [_attributes setObject:@(rotation) forKey:kGMURotationElementName];
}

- (void)parseEndCoordinates {
  if ([_geometryType isEqual:kGMUPointElementName]) {
    CLLocation *location = [self locationFromString:_characters];
    [_attributes setObject:location forKey:kGMUCoordinatesElementName];
  } else if ([_geometryType isEqual:kGMULineStringElementName]) {
    GMSPath *path = [self pathFromString:_characters];
    [_attributes setObject:path forKey:kGMUCoordinatesElementName];
  } else if ([_geometryType isEqual:kGMUPolygonElementName]) {
    GMSPath *boundary = [self pathFromString:_characters];
    if ([self isParsing:kGMUParserStateOuterBoundary]) {
      [_attributes setObject:boundary forKey:kGMUOuterBoundariesAttributeName];
    } else {
      NSMutableArray *innerBoundaries =
          [NSMutableArray
              arrayWithArray:[_attributes objectForKey:kGMUInnerBoundariesAttributeName]];
      [innerBoundaries addObject:boundary];
      [_attributes setObject:innerBoundaries forKey:kGMUInnerBoundariesAttributeName];
    }
  }
}

- (void)parser:(NSXMLParser *)parser
    didStartElement:(nonnull NSString *)elementName
       namespaceURI:(nullable NSString *)namespaceURI
      qualifiedName:(nullable NSString *)qualifiedName
         attributes:(nonnull NSDictionary<NSString *, NSString *> *)attributeDict {
  _characters = nil;
  if ([_styleRegex firstMatchInString:elementName
                              options:0
                                range:NSMakeRange(0, elementName.length)]) {
    [self parseBeginStyleWithElementName:elementName
                                 styleID:[attributeDict objectForKey:kGMUIdAttributeName]];
  } else if ([elementName isEqual:kGMUPlacemarkElementName] ||
                 [elementName isEqual:kGMUGroundOverlayElementName]) {
    [self parseBeginPlacemark];
  } else if ([elementName isEqual:kGMUHotspotElementName]) {
    [self parseBeginHotspotWithAttributes:attributeDict];
  } else if ([_geometryRegex firstMatchInString:elementName
                                        options:0
                                          range:NSMakeRange(0, elementName.length)] ||
             [elementName isEqual:kGMUGroundOverlayElementName]) {
    [self parseBeginGeometryWithElementName:elementName];
  } else if ([_boundaryRegex firstMatchInString:elementName
                                        options:0
                                          range:NSMakeRange(0, elementName.length)]) {
    [self parseBeginBoundaryWithElementName:elementName];
  } else if ([_styleAttributeRegex firstMatchInString:elementName
                                              options:0
                                                range:NSMakeRange(0, elementName.length)] ||
                 [_geometryAttributeRegex firstMatchInString:elementName
                                                     options:0
                                                       range:NSMakeRange(0, elementName.length)] ||
                     [_compassRegex firstMatchInString:elementName
                                               options:0
                                                 range:NSMakeRange(0, elementName.length)]) {
    [self parseBeginLeafNode];
  }
}

- (void)parser:(NSXMLParser *)parser
    didEndElement:(nonnull NSString *)elementName
     namespaceURI:(nullable NSString *)namespaceURI
    qualifiedName:(nullable NSString *)qualifiedName {
  if ([_styleRegex firstMatchInString:elementName
                              options:0
                                range:NSMakeRange(0, elementName.length)]) {
    [self parseEndStyle];
  } else if ([_styleAttributeRegex firstMatchInString:elementName
                                              options:0
                                                range:NSMakeRange(0, elementName.length)]) {
    [self parseEndStyleAttribute:elementName];
  } else if ([elementName isEqual:kGMUPlacemarkElementName]) {
    [self parseEndPlacemark];
  } else if ([elementName isEqual:kGMUGroundOverlayElementName]) {
    [self parseEndGroundOverlay];
  } else if ([_geometryRegex firstMatchInString:elementName
                                        options:0
                                          range:NSMakeRange(0, elementName.length)]) {
    [self parseEndGeometryWithElementName:elementName];
  } else if ([_geometryAttributeRegex firstMatchInString:elementName
                                                 options:0
                                                   range:NSMakeRange(0, elementName.length)]) {
    [self parseEndGeometryAttribute:elementName];
  } else if ([_compassRegex firstMatchInString:elementName
                                       options:0
                                         range:NSMakeRange(0, elementName.length)]) {
    [self parseEndCompassAttribute:elementName];
  }
  _parserState &= ~kGMUParserStateLeafNode;
  _characters = nil;
}

- (void)parser:(NSXMLParser *)parser foundCharacters:(nonnull NSString *)string {
  if ([self isParsing:kGMUParserStateLeafNode]) {
    if (!_characters) {
      _characters = [string mutableCopy];
    } else {
      [_characters appendString:string];
    }
  }
}

@end
