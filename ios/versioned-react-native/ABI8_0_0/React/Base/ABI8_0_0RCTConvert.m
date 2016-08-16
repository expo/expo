/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTConvert.h"

#import <objc/message.h>

#import "ABI8_0_0RCTDefines.h"
#import "ABI8_0_0RCTImageSource.h"
#import "ABI8_0_0RCTParserUtils.h"
#import "ABI8_0_0RCTUtils.h"

@implementation ABI8_0_0RCTConvert

ABI8_0_0RCT_CONVERTER(id, id, self)

ABI8_0_0RCT_CONVERTER(BOOL, BOOL, boolValue)
ABI8_0_0RCT_NUMBER_CONVERTER(double, doubleValue)
ABI8_0_0RCT_NUMBER_CONVERTER(float, floatValue)
ABI8_0_0RCT_NUMBER_CONVERTER(int, intValue)

ABI8_0_0RCT_NUMBER_CONVERTER(int64_t, longLongValue);
ABI8_0_0RCT_NUMBER_CONVERTER(uint64_t, unsignedLongLongValue);

ABI8_0_0RCT_NUMBER_CONVERTER(NSInteger, integerValue)
ABI8_0_0RCT_NUMBER_CONVERTER(NSUInteger, unsignedIntegerValue)

/**
 * This macro is used for creating converter functions for directly
 * representable json values that require no conversion.
 */
#if ABI8_0_0RCT_DEBUG
#define ABI8_0_0RCT_JSON_CONVERTER(type)           \
+ (type *)type:(id)json                    \
{                                          \
  if ([json isKindOfClass:[type class]]) { \
    return json;                           \
  } else if (json) {                       \
    ABI8_0_0RCTLogConvertError(json, @#type);      \
  }                                        \
  return nil;                              \
}
#else
#define ABI8_0_0RCT_JSON_CONVERTER(type)           \
+ (type *)type:(id)json { return json; }
#endif

ABI8_0_0RCT_JSON_CONVERTER(NSArray)
ABI8_0_0RCT_JSON_CONVERTER(NSDictionary)
ABI8_0_0RCT_JSON_CONVERTER(NSString)
ABI8_0_0RCT_JSON_CONVERTER(NSNumber)

ABI8_0_0RCT_CUSTOM_CONVERTER(NSSet *, NSSet, [NSSet setWithArray:json])
ABI8_0_0RCT_CUSTOM_CONVERTER(NSData *, NSData, [json dataUsingEncoding:NSUTF8StringEncoding])

+ (NSIndexSet *)NSIndexSet:(id)json
{
  json = [self NSNumberArray:json];
  NSMutableIndexSet *indexSet = [NSMutableIndexSet new];
  for (NSNumber *number in json) {
    NSInteger index = number.integerValue;
    if (ABI8_0_0RCT_DEBUG && index < 0) {
      ABI8_0_0RCTLogError(@"Invalid index value %zd. Indices must be positive.", index);
    }
    [indexSet addIndex:index];
  }
  return indexSet;
}

+ (NSURL *)NSURL:(id)json
{
  NSString *path = [self NSString:json];
  if (!path) {
    return nil;
  }

  @try { // NSURL has a history of crashing with bad input, so let's be safe

    NSURL *URL = [NSURL URLWithString:path];
    if (URL.scheme) { // Was a well-formed absolute URL
      return URL;
    }

    // Check if it has a scheme
    if ([path rangeOfString:@":"].location != NSNotFound) {
      path = [path stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
      URL = [NSURL URLWithString:path];
      if (URL) {
        return URL;
      }
    }

    // Assume that it's a local path
    path = path.stringByRemovingPercentEncoding;
    if ([path hasPrefix:@"~"]) {
      // Path is inside user directory
      path = path.stringByExpandingTildeInPath;
    } else if (!path.absolutePath) {
      // Assume it's a resource path
      path = [[NSBundle mainBundle].resourcePath stringByAppendingPathComponent:path];
    }
    if (!(URL = [NSURL fileURLWithPath:path])) {
      ABI8_0_0RCTLogConvertError(json, @"a valid URL");
    }
    return URL;
  }
  @catch (__unused NSException *e) {
    ABI8_0_0RCTLogConvertError(json, @"a valid URL");
    return nil;
  }
}

+ (NSURLRequest *)NSURLRequest:(id)json
{
  if ([json isKindOfClass:[NSString class]]) {
    NSURL *URL = [self NSURL:json];
    return URL ? [NSURLRequest requestWithURL:URL] : nil;
  }
  if ([json isKindOfClass:[NSDictionary class]]) {
    NSURL *URL = [self NSURL:json[@"uri"] ?: json[@"url"]];
    if (!URL) {
      return nil;
    }
    NSData *body = [self NSData:json[@"body"]];
    NSString *method = [self NSString:json[@"method"]].uppercaseString ?: @"GET";
    NSDictionary *headers = [self NSDictionary:json[@"headers"]];
    if ([method isEqualToString:@"GET"] && headers == nil && body == nil) {
      return [NSURLRequest requestWithURL:URL];
    }

    if (headers) {
      __block BOOL allHeadersAreStrings = YES;
      [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id header, BOOL *stop) {
        if (![header isKindOfClass:[NSString class]]) {
          ABI8_0_0RCTLogError(@"Values of HTTP headers passed must be  of type string. "
                      "Value of header '%@' is not a string.", key);
          allHeadersAreStrings = NO;
          *stop = YES;
        }
      }];
      if (!allHeadersAreStrings) {
        // Set headers to nil here to avoid crashing later.
        headers = nil;
      }
    }

    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
    request.HTTPBody = body;
    request.HTTPMethod = method;
    request.allHTTPHeaderFields = headers;
    return [request copy];
  }
  if (json) {
    ABI8_0_0RCTLogConvertError(json, @"a valid URLRequest");
  }
  return nil;
}

+ (ABI8_0_0RCTFileURL *)ABI8_0_0RCTFileURL:(id)json
{
  NSURL *fileURL = [self NSURL:json];
  if (!fileURL.fileURL) {
    ABI8_0_0RCTLogError(@"URI must be a local file, '%@' isn't.", fileURL);
    return nil;
  }
  if (![[NSFileManager defaultManager] fileExistsAtPath:fileURL.path]) {
    ABI8_0_0RCTLogError(@"File '%@' could not be found.", fileURL);
    return nil;
  }
  return fileURL;
}

+ (NSDate *)NSDate:(id)json
{
  if ([json isKindOfClass:[NSNumber class]]) {
    return [NSDate dateWithTimeIntervalSince1970:[self NSTimeInterval:json]];
  } else if ([json isKindOfClass:[NSString class]]) {
    static NSDateFormatter *formatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      formatter = [NSDateFormatter new];
      formatter.dateFormat = @"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ";
      formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
      formatter.timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
    });
    NSDate *date = [formatter dateFromString:json];
    if (!date) {
      ABI8_0_0RCTLogError(@"JSON String '%@' could not be interpreted as a date. "
                  "Expected format: YYYY-MM-DD'T'HH:mm:ss.sssZ", json);
    }
    return date;
  } else if (json) {
    ABI8_0_0RCTLogConvertError(json, @"a date");
  }
  return nil;
}

// JS Standard for time is milliseconds
ABI8_0_0RCT_CUSTOM_CONVERTER(NSTimeInterval, NSTimeInterval, [self double:json] / 1000.0)

// JS standard for time zones is minutes.
ABI8_0_0RCT_CUSTOM_CONVERTER(NSTimeZone *, NSTimeZone, [NSTimeZone timeZoneForSecondsFromGMT:[self double:json] * 60.0])

NSNumber *ABI8_0_0RCTConvertEnumValue(const char *typeName, NSDictionary *mapping, NSNumber *defaultValue, id json)
{
  if (!json) {
    return defaultValue;
  }
  if ([json isKindOfClass:[NSNumber class]]) {
    NSArray *allValues = mapping.allValues;
    if ([allValues containsObject:json] || [json isEqual:defaultValue]) {
      return json;
    }
    ABI8_0_0RCTLogError(@"Invalid %s '%@'. should be one of: %@", typeName, json, allValues);
    return defaultValue;
  }
  if (ABI8_0_0RCT_DEBUG && ![json isKindOfClass:[NSString class]]) {
    ABI8_0_0RCTLogError(@"Expected NSNumber or NSString for %s, received %@: %@",
                typeName, [json classForCoder], json);
  }
  id value = mapping[json];
  if (ABI8_0_0RCT_DEBUG && !value && [json description].length > 0) {
    ABI8_0_0RCTLogError(@"Invalid %s '%@'. should be one of: %@", typeName, json, [[mapping allKeys] sortedArrayUsingSelector: @selector(caseInsensitiveCompare:)]);
  }
  return value ?: defaultValue;
}

NSNumber *ABI8_0_0RCTConvertMultiEnumValue(const char *typeName, NSDictionary *mapping, NSNumber *defaultValue, id json)
{
  if ([json isKindOfClass:[NSArray class]]) {
    if ([json count] == 0) {
      return defaultValue;
    }
    long long result = 0;
    for (id arrayElement in json) {
      NSNumber *value = ABI8_0_0RCTConvertEnumValue(typeName, mapping, defaultValue, arrayElement);
      result |= value.longLongValue;
    }
    return @(result);
  }
  return ABI8_0_0RCTConvertEnumValue(typeName, mapping, defaultValue, json);
}

ABI8_0_0RCT_ENUM_CONVERTER(NSLineBreakMode, (@{
  @"clip": @(NSLineBreakByClipping),
  @"head": @(NSLineBreakByTruncatingHead),
  @"tail": @(NSLineBreakByTruncatingTail),
  @"middle": @(NSLineBreakByTruncatingMiddle),
  @"wordWrapping": @(NSLineBreakByWordWrapping),
}), NSLineBreakByTruncatingTail, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(NSTextAlignment, (@{
  @"auto": @(NSTextAlignmentNatural),
  @"left": @(NSTextAlignmentLeft),
  @"center": @(NSTextAlignmentCenter),
  @"right": @(NSTextAlignmentRight),
  @"justify": @(NSTextAlignmentJustified),
}), NSTextAlignmentNatural, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(NSUnderlineStyle, (@{
  @"solid": @(NSUnderlineStyleSingle),
  @"double": @(NSUnderlineStyleDouble),
  @"dotted": @(NSUnderlinePatternDot | NSUnderlineStyleSingle),
  @"dashed": @(NSUnderlinePatternDash | NSUnderlineStyleSingle),
}), NSUnderlineStyleSingle, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(ABI8_0_0RCTBorderStyle, (@{
  @"solid": @(ABI8_0_0RCTBorderStyleSolid),
  @"dotted": @(ABI8_0_0RCTBorderStyleDotted),
  @"dashed": @(ABI8_0_0RCTBorderStyleDashed),
}), ABI8_0_0RCTBorderStyleSolid, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(ABI8_0_0RCTTextDecorationLineType, (@{
  @"none": @(ABI8_0_0RCTTextDecorationLineTypeNone),
  @"underline": @(ABI8_0_0RCTTextDecorationLineTypeUnderline),
  @"line-through": @(ABI8_0_0RCTTextDecorationLineTypeStrikethrough),
  @"underline line-through": @(ABI8_0_0RCTTextDecorationLineTypeUnderlineStrikethrough),
}), ABI8_0_0RCTTextDecorationLineTypeNone, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(NSWritingDirection, (@{
  @"auto": @(NSWritingDirectionNatural),
  @"ltr": @(NSWritingDirectionLeftToRight),
  @"rtl": @(NSWritingDirectionRightToLeft),
}), NSWritingDirectionNatural, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(UITextAutocapitalizationType, (@{
  @"none": @(UITextAutocapitalizationTypeNone),
  @"words": @(UITextAutocapitalizationTypeWords),
  @"sentences": @(UITextAutocapitalizationTypeSentences),
  @"characters": @(UITextAutocapitalizationTypeAllCharacters)
}), UITextAutocapitalizationTypeSentences, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(UITextFieldViewMode, (@{
  @"never": @(UITextFieldViewModeNever),
  @"while-editing": @(UITextFieldViewModeWhileEditing),
  @"unless-editing": @(UITextFieldViewModeUnlessEditing),
  @"always": @(UITextFieldViewModeAlways),
}), UITextFieldViewModeNever, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(UIKeyboardType, (@{
  @"default": @(UIKeyboardTypeDefault),
  @"ascii-capable": @(UIKeyboardTypeASCIICapable),
  @"numbers-and-punctuation": @(UIKeyboardTypeNumbersAndPunctuation),
  @"url": @(UIKeyboardTypeURL),
  @"number-pad": @(UIKeyboardTypeNumberPad),
  @"phone-pad": @(UIKeyboardTypePhonePad),
  @"name-phone-pad": @(UIKeyboardTypeNamePhonePad),
  @"email-address": @(UIKeyboardTypeEmailAddress),
  @"decimal-pad": @(UIKeyboardTypeDecimalPad),
  @"twitter": @(UIKeyboardTypeTwitter),
  @"web-search": @(UIKeyboardTypeWebSearch),
  // Added for Android compatibility
  @"numeric": @(UIKeyboardTypeDecimalPad),
}), UIKeyboardTypeDefault, integerValue)

ABI8_0_0RCT_MULTI_ENUM_CONVERTER(UIDataDetectorTypes, (@{
  @"phoneNumber": @(UIDataDetectorTypePhoneNumber),
  @"link": @(UIDataDetectorTypeLink),
  @"address": @(UIDataDetectorTypeAddress),
  @"calendarEvent": @(UIDataDetectorTypeCalendarEvent),
  @"none": @(UIDataDetectorTypeNone),
  @"all": @(UIDataDetectorTypeAll),
}), UIDataDetectorTypePhoneNumber, unsignedLongLongValue)

ABI8_0_0RCT_ENUM_CONVERTER(UIKeyboardAppearance, (@{
  @"default": @(UIKeyboardAppearanceDefault),
  @"light": @(UIKeyboardAppearanceLight),
  @"dark": @(UIKeyboardAppearanceDark),
}), UIKeyboardAppearanceDefault, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(UIReturnKeyType, (@{
  @"default": @(UIReturnKeyDefault),
  @"go": @(UIReturnKeyGo),
  @"google": @(UIReturnKeyGoogle),
  @"join": @(UIReturnKeyJoin),
  @"next": @(UIReturnKeyNext),
  @"route": @(UIReturnKeyRoute),
  @"search": @(UIReturnKeySearch),
  @"send": @(UIReturnKeySend),
  @"yahoo": @(UIReturnKeyYahoo),
  @"done": @(UIReturnKeyDone),
  @"emergency-call": @(UIReturnKeyEmergencyCall),
}), UIReturnKeyDefault, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(UIViewContentMode, (@{
  @"scale-to-fill": @(UIViewContentModeScaleToFill),
  @"scale-aspect-fit": @(UIViewContentModeScaleAspectFit),
  @"scale-aspect-fill": @(UIViewContentModeScaleAspectFill),
  @"redraw": @(UIViewContentModeRedraw),
  @"center": @(UIViewContentModeCenter),
  @"top": @(UIViewContentModeTop),
  @"bottom": @(UIViewContentModeBottom),
  @"left": @(UIViewContentModeLeft),
  @"right": @(UIViewContentModeRight),
  @"top-left": @(UIViewContentModeTopLeft),
  @"top-right": @(UIViewContentModeTopRight),
  @"bottom-left": @(UIViewContentModeBottomLeft),
  @"bottom-right": @(UIViewContentModeBottomRight),
  // Cross-platform values
  @"cover": @(UIViewContentModeScaleAspectFill),
  @"contain": @(UIViewContentModeScaleAspectFit),
  @"stretch": @(UIViewContentModeScaleToFill),
}), UIViewContentModeScaleAspectFill, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(UIBarStyle, (@{
  @"default": @(UIBarStyleDefault),
  @"black": @(UIBarStyleBlack),
}), UIBarStyleDefault, integerValue)

// TODO: normalise the use of w/width so we can do away with the alias values (#6566645)
static void ABI8_0_0RCTConvertCGStructValue(const char *type, NSArray *fields, NSDictionary *aliases, CGFloat *result, id json)
{
  NSUInteger count = fields.count;
  if ([json isKindOfClass:[NSArray class]]) {
    if (ABI8_0_0RCT_DEBUG && [json count] != count) {
      ABI8_0_0RCTLogError(@"Expected array with count %zd, but count is %zd: %@", count, [json count], json);
    } else {
      for (NSUInteger i = 0; i < count; i++) {
        result[i] = [ABI8_0_0RCTConvert CGFloat:json[i]];
      }
    }
  } else if ([json isKindOfClass:[NSDictionary class]]) {
    if (aliases.count) {
      json = [json mutableCopy];
      for (NSString *alias in aliases) {
        NSString *key = aliases[alias];
        NSNumber *number = json[alias];
        if (number != nil) {
          ABI8_0_0RCTLogWarn(@"Using deprecated '%@' property for '%s'. Use '%@' instead.", alias, type, key);
          ((NSMutableDictionary *)json)[key] = number;
        }
      }
    }
    for (NSUInteger i = 0; i < count; i++) {
      result[i] = [ABI8_0_0RCTConvert CGFloat:json[fields[i]]];
    }
  } else if (json) {
    ABI8_0_0RCTLogConvertError(json, @(type));
  }
}

/**
 * This macro is used for creating converter functions for structs that consist
 * of a number of CGFloat properties, such as CGPoint, CGRect, etc.
 */
#define ABI8_0_0RCT_CGSTRUCT_CONVERTER(type, values, aliases) \
+ (type)type:(id)json                                 \
{                                                     \
  static NSArray *fields;                             \
  static dispatch_once_t onceToken;                   \
  dispatch_once(&onceToken, ^{                        \
    fields = values;                                  \
  });                                                 \
  type result;                                        \
  ABI8_0_0RCTConvertCGStructValue(#type, fields, aliases, (CGFloat *)&result, json); \
  return result;                                      \
}

ABI8_0_0RCT_CUSTOM_CONVERTER(CGFloat, CGFloat, [self double:json])
ABI8_0_0RCT_CGSTRUCT_CONVERTER(CGPoint, (@[@"x", @"y"]), (@{@"l": @"x", @"t": @"y"}))
ABI8_0_0RCT_CGSTRUCT_CONVERTER(CGSize, (@[@"width", @"height"]), (@{@"w": @"width", @"h": @"height"}))
ABI8_0_0RCT_CGSTRUCT_CONVERTER(CGRect, (@[@"x", @"y", @"width", @"height"]), (@{@"l": @"x", @"t": @"y", @"w": @"width", @"h": @"height"}))
ABI8_0_0RCT_CGSTRUCT_CONVERTER(UIEdgeInsets, (@[@"top", @"left", @"bottom", @"right"]), nil)

ABI8_0_0RCT_ENUM_CONVERTER(CGLineJoin, (@{
  @"miter": @(kCGLineJoinMiter),
  @"round": @(kCGLineJoinRound),
  @"bevel": @(kCGLineJoinBevel),
}), kCGLineJoinMiter, intValue)

ABI8_0_0RCT_ENUM_CONVERTER(CGLineCap, (@{
  @"butt": @(kCGLineCapButt),
  @"round": @(kCGLineCapRound),
  @"square": @(kCGLineCapSquare),
}), kCGLineCapButt, intValue)

ABI8_0_0RCT_CGSTRUCT_CONVERTER(CATransform3D, (@[
  @"m11", @"m12", @"m13", @"m14",
  @"m21", @"m22", @"m23", @"m24",
  @"m31", @"m32", @"m33", @"m34",
  @"m41", @"m42", @"m43", @"m44"
]), nil)

ABI8_0_0RCT_CGSTRUCT_CONVERTER(CGAffineTransform, (@[
  @"a", @"b", @"c", @"d", @"tx", @"ty"
]), nil)

+ (UIColor *)UIColor:(id)json
{
  if (!json) {
    return nil;
  }
  if ([json isKindOfClass:[NSArray class]]) {
    NSArray *components = [self NSNumberArray:json];
    CGFloat alpha = components.count > 3 ? [self CGFloat:components[3]] : 1.0;
    return [UIColor colorWithRed:[self CGFloat:components[0]]
                           green:[self CGFloat:components[1]]
                            blue:[self CGFloat:components[2]]
                           alpha:alpha];
  } else if ([json isKindOfClass:[NSNumber class]]) {
    NSUInteger argb = [self NSUInteger:json];
    CGFloat a = ((argb >> 24) & 0xFF) / 255.0;
    CGFloat r = ((argb >> 16) & 0xFF) / 255.0;
    CGFloat g = ((argb >> 8) & 0xFF) / 255.0;
    CGFloat b = (argb & 0xFF) / 255.0;
    return [UIColor colorWithRed:r green:g blue:b alpha:a];
  } else {
    ABI8_0_0RCTLogConvertError(json, @"a UIColor. Did you forget to call processColor() on the JS side?");
    return nil;
  }
}

+ (CGColorRef)CGColor:(id)json
{
  return [self UIColor:json].CGColor;
}

#if !defined(__IPHONE_8_2) || __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_2

// These constants are defined in iPhone SDK 8.2, but the app cannot run on
// iOS < 8.2 unless we redefine them here. If you target iOS 8.2 or above
// as a base target, the standard constants will be used instead.

#define UIFontWeightUltraLight -0.8
#define UIFontWeightThin -0.6
#define UIFontWeightLight -0.4
#define UIFontWeightRegular 0
#define UIFontWeightMedium 0.23
#define UIFontWeightSemibold 0.3
#define UIFontWeightBold 0.4
#define UIFontWeightHeavy 0.56
#define UIFontWeightBlack 0.62

#endif

typedef CGFloat ABI8_0_0RCTFontWeight;
ABI8_0_0RCT_ENUM_CONVERTER(ABI8_0_0RCTFontWeight, (@{
  @"normal": @(UIFontWeightRegular),
  @"bold": @(UIFontWeightBold),
  @"100": @(UIFontWeightUltraLight),
  @"200": @(UIFontWeightThin),
  @"300": @(UIFontWeightLight),
  @"400": @(UIFontWeightRegular),
  @"500": @(UIFontWeightMedium),
  @"600": @(UIFontWeightSemibold),
  @"700": @(UIFontWeightBold),
  @"800": @(UIFontWeightHeavy),
  @"900": @(UIFontWeightBlack),
}), UIFontWeightRegular, doubleValue)

typedef BOOL ABI8_0_0RCTFontStyle;
ABI8_0_0RCT_ENUM_CONVERTER(ABI8_0_0RCTFontStyle, (@{
  @"normal": @NO,
  @"italic": @YES,
  @"oblique": @YES,
}), NO, boolValue)

static ABI8_0_0RCTFontWeight ABI8_0_0RCTWeightOfFont(UIFont *font)
{
  static NSDictionary *nameToWeight;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    nameToWeight = @{
      @"normal": @(UIFontWeightRegular),
      @"bold": @(UIFontWeightBold),
      @"ultralight": @(UIFontWeightUltraLight),
      @"thin": @(UIFontWeightThin),
      @"light": @(UIFontWeightLight),
      @"regular": @(UIFontWeightRegular),
      @"medium": @(UIFontWeightMedium),
      @"semibold": @(UIFontWeightSemibold),
      @"bold": @(UIFontWeightBold),
      @"heavy": @(UIFontWeightHeavy),
      @"black": @(UIFontWeightBlack),
    };
  });

  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  ABI8_0_0RCTFontWeight weight = [traits[UIFontWeightTrait] doubleValue];
  if (weight == 0.0) {
    for (NSString *name in nameToWeight) {
      if ([font.fontName.lowercaseString hasSuffix:name]) {
        return [nameToWeight[name] doubleValue];
      }
    }
  }
  return weight;
}

static BOOL ABI8_0_0RCTFontIsItalic(UIFont *font)
{
  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  UIFontDescriptorSymbolicTraits symbolicTraits = [traits[UIFontSymbolicTrait] unsignedIntValue];
  return (symbolicTraits & UIFontDescriptorTraitItalic) != 0;
}

static BOOL ABI8_0_0RCTFontIsCondensed(UIFont *font)
{
  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  UIFontDescriptorSymbolicTraits symbolicTraits = [traits[UIFontSymbolicTrait] unsignedIntValue];
  return (symbolicTraits & UIFontDescriptorTraitCondensed) != 0;
}

+ (UIFont *)UIFont:(id)json
{
  json = [self NSDictionary:json];
  return [self UIFont:nil
           withFamily:json[@"fontFamily"]
                 size:json[@"fontSize"]
               weight:json[@"fontWeight"]
                style:json[@"fontStyle"]
          scaleMultiplier:1.0f];
}

+ (UIFont *)UIFont:(UIFont *)font withSize:(id)json
{
  return [self UIFont:font withFamily:nil size:json weight:nil style:nil scaleMultiplier:1.0];
}

+ (UIFont *)UIFont:(UIFont *)font withWeight:(id)json
{
  return [self UIFont:font withFamily:nil size:nil weight:json style:nil scaleMultiplier:1.0];
}

+ (UIFont *)UIFont:(UIFont *)font withStyle:(id)json
{
  return [self UIFont:font withFamily:nil size:nil weight:nil style:json scaleMultiplier:1.0];
}

+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)json
{
  return [self UIFont:font withFamily:json size:nil weight:nil style:nil scaleMultiplier:1.0];
}

+ (UIFont *)UIFont:(UIFont *)font withFamily:(id)family
              size:(id)size weight:(id)weight style:(id)style
   scaleMultiplier:(CGFloat)scaleMultiplier
{
  // Defaults
  NSString *const ABI8_0_0RCTDefaultFontFamily = @"System";
  NSString *const ABI8_0_0RCTIOS8SystemFontFamily = @"Helvetica Neue";
  const ABI8_0_0RCTFontWeight ABI8_0_0RCTDefaultFontWeight = UIFontWeightRegular;
  const CGFloat ABI8_0_0RCTDefaultFontSize = 14;

  // Initialize properties to defaults
  CGFloat fontSize = ABI8_0_0RCTDefaultFontSize;
  ABI8_0_0RCTFontWeight fontWeight = ABI8_0_0RCTDefaultFontWeight;
  NSString *familyName = ABI8_0_0RCTDefaultFontFamily;
  BOOL isItalic = NO;
  BOOL isCondensed = NO;

  if (font) {
    familyName = font.familyName ?: ABI8_0_0RCTDefaultFontFamily;
    fontSize = font.pointSize ?: ABI8_0_0RCTDefaultFontSize;
    fontWeight = ABI8_0_0RCTWeightOfFont(font);
    isItalic = ABI8_0_0RCTFontIsItalic(font);
    isCondensed = ABI8_0_0RCTFontIsCondensed(font);
  }

  // Get font attributes
  fontSize = [self CGFloat:size] ?: fontSize;
  if (scaleMultiplier > 0.0 && scaleMultiplier != 1.0) {
    fontSize = round(fontSize * scaleMultiplier);
  }
  familyName = [self NSString:family] ?: familyName;
  isItalic = style ? [self ABI8_0_0RCTFontStyle:style] : isItalic;
  fontWeight = weight ? [self ABI8_0_0RCTFontWeight:weight] : fontWeight;

  // Handle system font as special case. This ensures that we preserve
  // the specific metrics of the standard system font as closely as possible.
  if ([familyName isEqual:ABI8_0_0RCTDefaultFontFamily]) {
    if ([UIFont respondsToSelector:@selector(systemFontOfSize:weight:)]) {
      font = [UIFont systemFontOfSize:fontSize weight:fontWeight];
      if (isItalic || isCondensed) {
        UIFontDescriptor *fontDescriptor = [font fontDescriptor];
        UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
        if (isItalic) {
          symbolicTraits |= UIFontDescriptorTraitItalic;
        }
        if (isCondensed) {
          symbolicTraits |= UIFontDescriptorTraitCondensed;
        }
        fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
        font = [UIFont fontWithDescriptor:fontDescriptor size:fontSize];
      }
      return font;
    } else {
      // systemFontOfSize:weight: isn't available prior to iOS 8.2, so we
      // fall back to finding the correct font manually, by linear search.
      familyName = ABI8_0_0RCTIOS8SystemFontFamily;
    }
  }

  // Gracefully handle being given a font name rather than font family, for
  // example: "Helvetica Light Oblique" rather than just "Helvetica".
  if ([UIFont fontNamesForFamilyName:familyName].count == 0) {
    font = [UIFont fontWithName:familyName size:fontSize];
    if (font) {
      // It's actually a font name, not a font family name,
      // but we'll do what was meant, not what was said.
      familyName = font.familyName;
      fontWeight = weight ? fontWeight : ABI8_0_0RCTWeightOfFont(font);
      isItalic = style ? isItalic : ABI8_0_0RCTFontIsItalic(font);
      isCondensed = ABI8_0_0RCTFontIsCondensed(font);
    } else {
      // Not a valid font or family
      ABI8_0_0RCTLogError(@"Unrecognized font family '%@'", familyName);
      if ([UIFont respondsToSelector:@selector(systemFontOfSize:weight:)]) {
        font = [UIFont systemFontOfSize:fontSize weight:fontWeight];
      } else if (fontWeight > UIFontWeightRegular) {
        font = [UIFont boldSystemFontOfSize:fontSize];
      } else {
        font = [UIFont systemFontOfSize:fontSize];
      }
    }
  }

  // Get the closest font that matches the given weight for the fontFamily
  UIFont *bestMatch = font;
  CGFloat closestWeight = INFINITY;
  for (NSString *name in [UIFont fontNamesForFamilyName:familyName]) {
    UIFont *match = [UIFont fontWithName:name size:fontSize];
    if (isItalic == ABI8_0_0RCTFontIsItalic(match) &&
        isCondensed == ABI8_0_0RCTFontIsCondensed(match)) {
      CGFloat testWeight = ABI8_0_0RCTWeightOfFont(match);
      if (ABS(testWeight - fontWeight) < ABS(closestWeight - fontWeight)) {
        bestMatch = match;
        closestWeight = testWeight;
      }
    }
  }

  return bestMatch;
}

NSArray *ABI8_0_0RCTConvertArrayValue(SEL type, id json)
{
  __block BOOL copy = NO;
  __block NSArray *values = json = [ABI8_0_0RCTConvert NSArray:json];
  [json enumerateObjectsUsingBlock:^(id jsonValue, NSUInteger idx, __unused BOOL *stop) {
    id value = ((id(*)(Class, SEL, id))objc_msgSend)([ABI8_0_0RCTConvert class], type, jsonValue);
    if (copy) {
      if (value) {
        [(NSMutableArray *)values addObject:value];
      }
    } else if (value != jsonValue) {
      // Converted value is different, so we'll need to copy the array
      values = [[NSMutableArray alloc] initWithCapacity:values.count];
      for (NSUInteger i = 0; i < idx; i++) {
        [(NSMutableArray *)values addObject:json[i]];
      }
      if (value) {
        [(NSMutableArray *)values addObject:value];
      }
      copy = YES;
    }
  }];
  return values;
}

SEL ABI8_0_0RCTConvertSelectorForType(NSString *type)
{
  const char *input = type.UTF8String;
  return NSSelectorFromString([ABI8_0_0RCTParseType(&input) stringByAppendingString:@":"]);
}

ABI8_0_0RCT_ARRAY_CONVERTER(NSURL)
ABI8_0_0RCT_ARRAY_CONVERTER(ABI8_0_0RCTFileURL)
ABI8_0_0RCT_ARRAY_CONVERTER(UIColor)

/**
 * This macro is used for creating converter functions for directly
 * representable json array values that require no conversion.
 */
#if ABI8_0_0RCT_DEBUG
#define ABI8_0_0RCT_JSON_ARRAY_CONVERTER(type) ABI8_0_0RCT_ARRAY_CONVERTER(type)
#else
#define ABI8_0_0RCT_JSON_ARRAY_CONVERTER(type) + (NSArray *)type##Array:(id)json { return json; }
#endif

ABI8_0_0RCT_JSON_ARRAY_CONVERTER(NSArray)
ABI8_0_0RCT_JSON_ARRAY_CONVERTER(NSString)
ABI8_0_0RCT_JSON_ARRAY_CONVERTER(NSStringArray)
ABI8_0_0RCT_JSON_ARRAY_CONVERTER(NSDictionary)
ABI8_0_0RCT_JSON_ARRAY_CONVERTER(NSNumber)

// Can't use ABI8_0_0RCT_ARRAY_CONVERTER due to bridged cast
+ (NSArray *)CGColorArray:(id)json
{
  NSMutableArray *colors = [NSMutableArray new];
  for (id value in [self NSArray:json]) {
    [colors addObject:(__bridge id)[self CGColor:value]];
  }
  return colors;
}

static id ABI8_0_0RCTConvertPropertyListValue(id json)
{
  if (!json || json == (id)kCFNull) {
    return nil;
  }

  if ([json isKindOfClass:[NSDictionary class]]) {
    __block BOOL copy = NO;
    NSMutableDictionary *values = [[NSMutableDictionary alloc] initWithCapacity:[json count]];
    [json enumerateKeysAndObjectsUsingBlock:^(NSString *key, id jsonValue, __unused BOOL *stop) {
      id value = ABI8_0_0RCTConvertPropertyListValue(jsonValue);
      if (value) {
        values[key] = value;
      }
      copy |= value != jsonValue;
    }];
    return copy ? values : json;
  }

  if ([json isKindOfClass:[NSArray class]]) {
    __block BOOL copy = NO;
    __block NSArray *values = json;
    [json enumerateObjectsUsingBlock:^(id jsonValue, NSUInteger idx, __unused BOOL *stop) {
      id value = ABI8_0_0RCTConvertPropertyListValue(jsonValue);
      if (copy) {
        if (value) {
          [(NSMutableArray *)values addObject:value];
        }
      } else if (value != jsonValue) {
        // Converted value is different, so we'll need to copy the array
        values = [[NSMutableArray alloc] initWithCapacity:values.count];
        for (NSUInteger i = 0; i < idx; i++) {
          [(NSMutableArray *)values addObject:json[i]];
        }
        if (value) {
          [(NSMutableArray *)values addObject:value];
        }
        copy = YES;
      }
    }];
    return values;
  }

  // All other JSON types are supported by property lists
  return json;
}

+ (NSPropertyList)NSPropertyList:(id)json
{
  return ABI8_0_0RCTConvertPropertyListValue(json);
}

ABI8_0_0RCT_ENUM_CONVERTER(css_backface_visibility_t, (@{
  @"hidden": @NO,
  @"visible": @YES
}), YES, boolValue)

ABI8_0_0RCT_ENUM_CONVERTER(css_clip_t, (@{
  @"hidden": @YES,
  @"visible": @NO
}), NO, boolValue)

ABI8_0_0RCT_ENUM_CONVERTER(ABI8_0_0CSSFlexDirection, (@{
  @"row": @(ABI8_0_0CSSFlexDirectionRow),
  @"row-reverse": @(ABI8_0_0CSSFlexDirectionRowReverse),
  @"column": @(ABI8_0_0CSSFlexDirectionColumn),
  @"column-reverse": @(ABI8_0_0CSSFlexDirectionColumnReverse)
}), ABI8_0_0CSSFlexDirectionColumn, intValue)

ABI8_0_0RCT_ENUM_CONVERTER(ABI8_0_0CSSJustify, (@{
  @"flex-start": @(ABI8_0_0CSSJustifyFlexStart),
  @"flex-end": @(ABI8_0_0CSSJustifyFlexEnd),
  @"center": @(ABI8_0_0CSSJustifyCenter),
  @"space-between": @(ABI8_0_0CSSJustifySpaceBetween),
  @"space-around": @(ABI8_0_0CSSJustifySpaceAround)
}), ABI8_0_0CSSJustifyFlexStart, intValue)

ABI8_0_0RCT_ENUM_CONVERTER(ABI8_0_0CSSAlign, (@{
  @"flex-start": @(ABI8_0_0CSSAlignFlexStart),
  @"flex-end": @(ABI8_0_0CSSAlignFlexEnd),
  @"center": @(ABI8_0_0CSSAlignCenter),
  @"auto": @(ABI8_0_0CSSAlignAuto),
  @"stretch": @(ABI8_0_0CSSAlignStretch)
}), ABI8_0_0CSSAlignFlexStart, intValue)

ABI8_0_0RCT_ENUM_CONVERTER(ABI8_0_0CSSPositionType, (@{
  @"absolute": @(ABI8_0_0CSSPositionTypeAbsolute),
  @"relative": @(ABI8_0_0CSSPositionTypeRelative)
}), ABI8_0_0CSSPositionTypeRelative, intValue)

ABI8_0_0RCT_ENUM_CONVERTER(ABI8_0_0CSSWrapType, (@{
  @"wrap": @(ABI8_0_0CSSWrapTypeWrap),
  @"nowrap": @(ABI8_0_0CSSWrapTypeNoWrap)
}), ABI8_0_0CSSWrapTypeNoWrap, intValue)

ABI8_0_0RCT_ENUM_CONVERTER(ABI8_0_0RCTPointerEvents, (@{
  @"none": @(ABI8_0_0RCTPointerEventsNone),
  @"box-only": @(ABI8_0_0RCTPointerEventsBoxOnly),
  @"box-none": @(ABI8_0_0RCTPointerEventsBoxNone),
  @"auto": @(ABI8_0_0RCTPointerEventsUnspecified)
}), ABI8_0_0RCTPointerEventsUnspecified, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(ABI8_0_0RCTAnimationType, (@{
  @"spring": @(ABI8_0_0RCTAnimationTypeSpring),
  @"linear": @(ABI8_0_0RCTAnimationTypeLinear),
  @"easeIn": @(ABI8_0_0RCTAnimationTypeEaseIn),
  @"easeOut": @(ABI8_0_0RCTAnimationTypeEaseOut),
  @"easeInEaseOut": @(ABI8_0_0RCTAnimationTypeEaseInEaseOut),
  @"keyboard": @(ABI8_0_0RCTAnimationTypeKeyboard),
}), ABI8_0_0RCTAnimationTypeEaseInEaseOut, integerValue)

@end

@interface ABI8_0_0RCTImageSource (Packager)

@property (nonatomic, assign) BOOL packagerAsset;

@end

@implementation ABI8_0_0RCTConvert (Deprecated)

/* This method is only used when loading images synchronously, e.g. for tabbar icons */
+ (UIImage *)UIImage:(id)json
{
  if (!json) {
    return nil;
  }

  ABI8_0_0RCTImageSource *imageSource = [self ABI8_0_0RCTImageSource:json];
  if (!imageSource) {
    return nil;
  }

  __block UIImage *image;
  if (!ABI8_0_0RCTIsMainQueue()) {
    // It seems that none of the UIImage loading methods can be guaranteed
    // thread safe, so we'll pick the lesser of two evils here and block rather
    // than run the risk of crashing
    ABI8_0_0RCTLogWarn(@"Calling [ABI8_0_0RCTConvert UIImage:] on a background thread is not recommended");
    dispatch_sync(dispatch_get_main_queue(), ^{
      image = [self UIImage:json];
    });
    return image;
  }

  NSURL *URL = imageSource.request.URL;
  NSString *scheme = URL.scheme.lowercaseString;
  if ([scheme isEqualToString:@"file"]) {
    NSString *assetName = ABI8_0_0RCTBundlePathForURL(URL);
    image = assetName ? [UIImage imageNamed:assetName] : nil;
    if (!image) {
      // Attempt to load from the file system
      NSString *filePath = URL.path;
      if (filePath.pathExtension.length == 0) {
        filePath = [filePath stringByAppendingPathExtension:@"png"];
      }
      image = [UIImage imageWithContentsOfFile:filePath];
    }
  } else if ([scheme isEqualToString:@"data"]) {
    image = [UIImage imageWithData:[NSData dataWithContentsOfURL:URL]];
  } else if ([scheme isEqualToString:@"http"] && imageSource.packagerAsset) {
    image = [UIImage imageWithData:[NSData dataWithContentsOfURL:URL]];
  } else {
    ABI8_0_0RCTLogConvertError(json, @"an image. Only local files or data URIs are supported");
  }

  CGFloat scale = imageSource.scale;
  if (!scale && imageSource.size.width) {
    // If no scale provided, set scale to image width / source width
    scale = CGImageGetWidth(image.CGImage) / imageSource.size.width;
  }

  if (scale) {
    image = [UIImage imageWithCGImage:image.CGImage
                                scale:scale
                          orientation:image.imageOrientation];
  }

  if (!CGSizeEqualToSize(imageSource.size, CGSizeZero) &&
      !CGSizeEqualToSize(imageSource.size, image.size)) {
    ABI8_0_0RCTLogError(@"Image source %@ size %@ does not match loaded image size %@.",
                URL.path.lastPathComponent,
                NSStringFromCGSize(imageSource.size),
                NSStringFromCGSize(image.size));
  }

  return image;
}

+ (CGImageRef)CGImage:(id)json
{
  return [self UIImage:json].CGImage;
}

@end
