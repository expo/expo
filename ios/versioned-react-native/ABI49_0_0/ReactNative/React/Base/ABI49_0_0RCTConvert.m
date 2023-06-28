/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTConvert.h"

#import <objc/message.h>

#import <CoreText/CoreText.h>

#import "ABI49_0_0RCTDefines.h"
#import "ABI49_0_0RCTImageSource.h"
#import "ABI49_0_0RCTParserUtils.h"
#import "ABI49_0_0RCTUtils.h"

@implementation ABI49_0_0RCTConvert

ABI49_0_0RCT_CONVERTER(id, id, self)

ABI49_0_0RCT_CONVERTER(BOOL, BOOL, boolValue)
ABI49_0_0RCT_NUMBER_CONVERTER(double, doubleValue)
ABI49_0_0RCT_NUMBER_CONVERTER(float, floatValue)
ABI49_0_0RCT_NUMBER_CONVERTER(int, intValue)

ABI49_0_0RCT_NUMBER_CONVERTER(int64_t, longLongValue);
ABI49_0_0RCT_NUMBER_CONVERTER(uint64_t, unsignedLongLongValue);

ABI49_0_0RCT_NUMBER_CONVERTER(NSInteger, integerValue)
ABI49_0_0RCT_NUMBER_CONVERTER(NSUInteger, unsignedIntegerValue)

/**
 * This macro is used for creating converter functions for directly
 * representable json values that require no conversion.
 */
#if ABI49_0_0RCT_DEBUG
#define ABI49_0_0RCT_JSON_CONVERTER(type)             \
  +(type *)type : (id)json                   \
  {                                          \
    if ([json isKindOfClass:[type class]]) { \
      return json;                           \
    } else if (json) {                       \
      ABI49_0_0RCTLogConvertError(json, @ #type);     \
    }                                        \
    return nil;                              \
  }
#else
#define ABI49_0_0RCT_JSON_CONVERTER(type) \
  +(type *)type : (id)json       \
  {                              \
    return json;                 \
  }
#endif

ABI49_0_0RCT_JSON_CONVERTER(NSArray)
ABI49_0_0RCT_JSON_CONVERTER(NSDictionary)
ABI49_0_0RCT_JSON_CONVERTER(NSString)
ABI49_0_0RCT_JSON_CONVERTER(NSNumber)

ABI49_0_0RCT_CUSTOM_CONVERTER(NSSet *, NSSet, [NSSet setWithArray:json])
ABI49_0_0RCT_CUSTOM_CONVERTER(NSData *, NSData, [json dataUsingEncoding:NSUTF8StringEncoding])

+ (NSIndexSet *)NSIndexSet:(id)json
{
  json = [self NSNumberArray:json];
  NSMutableIndexSet *indexSet = [NSMutableIndexSet new];
  for (NSNumber *number in json) {
    NSInteger index = number.integerValue;
    if (ABI49_0_0RCT_DEBUG && index < 0) {
      ABI49_0_0RCTLogInfo(@"Invalid index value %lld. Indices must be positive.", (long long)index);
    }
    [indexSet addIndex:index];
  }
  return indexSet;
}

+ (NSURL *)NSURL:(id)json
{
  NSString *path = [self NSString:ABI49_0_0RCTNilIfNull(json)];
  if (!path) {
    return nil;
  }

  @try { // NSURL has a history of crashing with bad input, so let's be safe

    NSURL *URL = [NSURL URLWithString:path];
    if (URL.scheme) { // Was a well-formed absolute URL
      return URL;
    }

    // Check if it has a scheme
    if ([path rangeOfString:@"://"].location != NSNotFound) {
      NSMutableCharacterSet *urlAllowedCharacterSet = [NSMutableCharacterSet new];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLUserAllowedCharacterSet]];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLPasswordAllowedCharacterSet]];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLHostAllowedCharacterSet]];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLPathAllowedCharacterSet]];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLQueryAllowedCharacterSet]];
      [urlAllowedCharacterSet formUnionWithCharacterSet:[NSCharacterSet URLFragmentAllowedCharacterSet]];
      path = [path stringByAddingPercentEncodingWithAllowedCharacters:urlAllowedCharacterSet];
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
      ABI49_0_0RCTLogConvertError(json, @"a valid URL");
    }
    return URL;
  } @catch (__unused NSException *e) {
    ABI49_0_0RCTLogConvertError(json, @"a valid URL");
    return nil;
  }
}

ABI49_0_0RCT_ENUM_CONVERTER(
    NSURLRequestCachePolicy,
    (@{
      @"default" : @(NSURLRequestUseProtocolCachePolicy),
      @"reload" : @(NSURLRequestReloadIgnoringLocalCacheData),
      @"force-cache" : @(NSURLRequestReturnCacheDataElseLoad),
      @"only-if-cached" : @(NSURLRequestReturnCacheDataDontLoad),
    }),
    NSURLRequestUseProtocolCachePolicy,
    integerValue)

+ (NSURLRequest *)NSURLRequest:(id)json
{
  if ([json isKindOfClass:[NSString class]]) {
    NSURL *URL = [self NSURL:json];
    return URL ? [NSURLRequest requestWithURL:URL] : nil;
  }
  if ([json isKindOfClass:[NSDictionary class]]) {
    NSString *URLString = json[@"uri"] ?: json[@"url"];

    NSURL *URL;
    NSString *bundleName = json[@"bundle"];
    if (bundleName) {
      URLString = [NSString stringWithFormat:@"%@.bundle/%@", bundleName, URLString];
    }

    URL = [self NSURL:URLString];
    if (!URL) {
      return nil;
    }

    NSData *body = [self NSData:json[@"body"]];
    NSString *method = [self NSString:json[@"method"]].uppercaseString ?: @"GET";
    NSURLRequestCachePolicy cachePolicy = [self NSURLRequestCachePolicy:json[@"cache"]];
    NSDictionary *headers = [self NSDictionary:json[@"headers"]];
    if ([method isEqualToString:@"GET"] && headers == nil && body == nil &&
        cachePolicy == NSURLRequestUseProtocolCachePolicy) {
      return [NSURLRequest requestWithURL:URL];
    }

    if (headers) {
      __block BOOL allHeadersAreStrings = YES;
      [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id header, BOOL *stop) {
        if (![header isKindOfClass:[NSString class]]) {
          ABI49_0_0RCTLogInfo(
              @"Values of HTTP headers passed must be  of type string. "
               "Value of header '%@' is not a string.",
              key);
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
    request.cachePolicy = cachePolicy;
    request.allHTTPHeaderFields = headers;
    return [request copy];
  }
  if (json) {
    ABI49_0_0RCTLogConvertError(json, @"a valid URLRequest");
  }
  return nil;
}

+ (ABI49_0_0RCTFileURL *)ABI49_0_0RCTFileURL:(id)json
{
  NSURL *fileURL = [self NSURL:json];
  if (!fileURL.fileURL) {
    ABI49_0_0RCTLogInfo(@"URI must be a local file, '%@' isn't.", fileURL);
    return nil;
  }
  if (![[NSFileManager defaultManager] fileExistsAtPath:fileURL.path]) {
    ABI49_0_0RCTLogInfo(@"File '%@' could not be found.", fileURL);
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
      ABI49_0_0RCTLogInfo(
          @"JSON String '%@' could not be interpreted as a date. "
           "Expected format: YYYY-MM-DD'T'HH:mm:ss.sssZ",
          json);
    }
    return date;
  } else if (json) {
    ABI49_0_0RCTLogConvertError(json, @"a date");
  }
  return nil;
}

+ (NSLocale *)NSLocale:(id)json
{
  if ([json isKindOfClass:[NSString class]]) {
    NSLocale *locale = [[NSLocale alloc] initWithLocaleIdentifier:json];
    if (!locale) {
      ABI49_0_0RCTLogInfo(@"JSON String '%@' could not be interpreted as a valid locale. ", json);
    }
    return locale;
  } else if (json) {
    ABI49_0_0RCTLogConvertError(json, @"a locale");
  }
  return nil;
}

// JS Standard for time is milliseconds
ABI49_0_0RCT_CUSTOM_CONVERTER(NSTimeInterval, NSTimeInterval, [self double:json] / 1000.0)

// JS standard for time zones is minutes.
ABI49_0_0RCT_CUSTOM_CONVERTER(NSTimeZone *, NSTimeZone, [NSTimeZone timeZoneForSecondsFromGMT:[self double:json] * 60.0])

NSNumber *ABI49_0_0RCTConvertEnumValue(const char *typeName, NSDictionary *mapping, NSNumber *defaultValue, id json)
{
  if (!json) {
    return defaultValue;
  }
  if ([json isKindOfClass:[NSNumber class]]) {
    NSArray *allValues = mapping.allValues;
    if ([allValues containsObject:json] || [json isEqual:defaultValue]) {
      return json;
    }
    ABI49_0_0RCTLogInfo(@"Invalid %s '%@'. should be one of: %@", typeName, json, allValues);
    return defaultValue;
  }
  if (ABI49_0_0RCT_DEBUG && ![json isKindOfClass:[NSString class]]) {
    ABI49_0_0RCTLogInfo(@"Expected NSNumber or NSString for %s, received %@: %@", typeName, [json classForCoder], json);
  }
  id value = mapping[json];
  if (ABI49_0_0RCT_DEBUG && !value && [json description].length > 0) {
    ABI49_0_0RCTLogInfo(
        @"Invalid %s '%@'. should be one of: %@",
        typeName,
        json,
        [[mapping allKeys] sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)]);
  }
  return value ?: defaultValue;
}

NSNumber *ABI49_0_0RCTConvertMultiEnumValue(const char *typeName, NSDictionary *mapping, NSNumber *defaultValue, id json)
{
  if ([json isKindOfClass:[NSArray class]]) {
    if ([json count] == 0) {
      return defaultValue;
    }
    long long result = 0;
    for (id arrayElement in json) {
      NSNumber *value = ABI49_0_0RCTConvertEnumValue(typeName, mapping, defaultValue, arrayElement);
      result |= value.longLongValue;
    }
    return @(result);
  }
  return ABI49_0_0RCTConvertEnumValue(typeName, mapping, defaultValue, json);
}

ABI49_0_0RCT_ENUM_CONVERTER(
    NSLineBreakMode,
    (@{
      @"clip" : @(NSLineBreakByClipping),
      @"head" : @(NSLineBreakByTruncatingHead),
      @"tail" : @(NSLineBreakByTruncatingTail),
      @"middle" : @(NSLineBreakByTruncatingMiddle),
      @"wordWrapping" : @(NSLineBreakByWordWrapping),
    }),
    NSLineBreakByTruncatingTail,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    NSTextAlignment,
    (@{
      @"auto" : @(NSTextAlignmentNatural),
      @"left" : @(NSTextAlignmentLeft),
      @"center" : @(NSTextAlignmentCenter),
      @"right" : @(NSTextAlignmentRight),
      @"justify" : @(NSTextAlignmentJustified),
    }),
    NSTextAlignmentNatural,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    NSUnderlineStyle,
    (@{
      @"solid" : @(NSUnderlineStyleSingle),
      @"double" : @(NSUnderlineStyleDouble),
      @"dotted" : @(NSUnderlinePatternDot | NSUnderlineStyleSingle),
      @"dashed" : @(NSUnderlinePatternDash | NSUnderlineStyleSingle),
    }),
    NSUnderlineStyleSingle,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0RCTBorderStyle,
    (@{
      @"solid" : @(ABI49_0_0RCTBorderStyleSolid),
      @"dotted" : @(ABI49_0_0RCTBorderStyleDotted),
      @"dashed" : @(ABI49_0_0RCTBorderStyleDashed),
    }),
    ABI49_0_0RCTBorderStyleSolid,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0RCTBorderCurve,
    (@{
      @"circular" : @(ABI49_0_0RCTBorderCurveCircular),
      @"continuous" : @(ABI49_0_0RCTBorderCurveContinuous),
    }),
    ABI49_0_0RCTBorderCurveCircular,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0RCTTextDecorationLineType,
    (@{
      @"none" : @(ABI49_0_0RCTTextDecorationLineTypeNone),
      @"underline" : @(ABI49_0_0RCTTextDecorationLineTypeUnderline),
      @"line-through" : @(ABI49_0_0RCTTextDecorationLineTypeStrikethrough),
      @"underline line-through" : @(ABI49_0_0RCTTextDecorationLineTypeUnderlineStrikethrough),
    }),
    ABI49_0_0RCTTextDecorationLineTypeNone,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    NSWritingDirection,
    (@{
      @"auto" : @(NSWritingDirectionNatural),
      @"ltr" : @(NSWritingDirectionLeftToRight),
      @"rtl" : @(NSWritingDirectionRightToLeft),
    }),
    NSWritingDirectionNatural,
    integerValue)

+ (NSLineBreakStrategy)NSLineBreakStrategy:(id)json ABI49_0_0RCT_DYNAMIC
{
  if (@available(iOS 14.0, *)) {
    static NSDictionary *mapping;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      mapping = @{
        @"none" : @(NSLineBreakStrategyNone),
        @"standard" : @(NSLineBreakStrategyStandard),
        @"hangul-word" : @(NSLineBreakStrategyHangulWordPriority),
        @"push-out" : @(NSLineBreakStrategyPushOut)
      };
    });
    return ABI49_0_0RCTConvertEnumValue("NSLineBreakStrategy", mapping, @(NSLineBreakStrategyNone), json).integerValue;
  } else {
    return NSLineBreakStrategyNone;
  }
}

ABI49_0_0RCT_ENUM_CONVERTER(
    UITextAutocapitalizationType,
    (@{
      @"none" : @(UITextAutocapitalizationTypeNone),
      @"words" : @(UITextAutocapitalizationTypeWords),
      @"sentences" : @(UITextAutocapitalizationTypeSentences),
      @"characters" : @(UITextAutocapitalizationTypeAllCharacters)
    }),
    UITextAutocapitalizationTypeSentences,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    UITextFieldViewMode,
    (@{
      @"never" : @(UITextFieldViewModeNever),
      @"while-editing" : @(UITextFieldViewModeWhileEditing),
      @"unless-editing" : @(UITextFieldViewModeUnlessEditing),
      @"always" : @(UITextFieldViewModeAlways),
    }),
    UITextFieldViewModeNever,
    integerValue)

+ (UIKeyboardType)UIKeyboardType:(id)json ABI49_0_0RCT_DYNAMIC
{
  static NSDictionary<NSString *, NSNumber *> *mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSMutableDictionary<NSString *, NSNumber *> *temporaryMapping = [NSMutableDictionary dictionaryWithDictionary:@{
      @"default" : @(UIKeyboardTypeDefault),
      @"ascii-capable" : @(UIKeyboardTypeASCIICapable),
      @"numbers-and-punctuation" : @(UIKeyboardTypeNumbersAndPunctuation),
      @"url" : @(UIKeyboardTypeURL),
      @"number-pad" : @(UIKeyboardTypeNumberPad),
      @"phone-pad" : @(UIKeyboardTypePhonePad),
      @"name-phone-pad" : @(UIKeyboardTypeNamePhonePad),
      @"email-address" : @(UIKeyboardTypeEmailAddress),
      @"decimal-pad" : @(UIKeyboardTypeDecimalPad),
      @"twitter" : @(UIKeyboardTypeTwitter),
      @"web-search" : @(UIKeyboardTypeWebSearch),
      // Added for Android compatibility
      @"numeric" : @(UIKeyboardTypeDecimalPad),
    }];
    temporaryMapping[@"ascii-capable-number-pad"] = @(UIKeyboardTypeASCIICapableNumberPad);
    mapping = temporaryMapping;
  });

  UIKeyboardType type = ABI49_0_0RCTConvertEnumValue("UIKeyboardType", mapping, @(UIKeyboardTypeDefault), json).integerValue;
  return type;
}

ABI49_0_0RCT_MULTI_ENUM_CONVERTER(
    UIDataDetectorTypes,
    (@{
      @"phoneNumber" : @(UIDataDetectorTypePhoneNumber),
      @"link" : @(UIDataDetectorTypeLink),
      @"address" : @(UIDataDetectorTypeAddress),
      @"calendarEvent" : @(UIDataDetectorTypeCalendarEvent),
      @"none" : @(UIDataDetectorTypeNone),
      @"all" : @(UIDataDetectorTypeAll),
    }),
    UIDataDetectorTypePhoneNumber,
    unsignedLongLongValue)

ABI49_0_0RCT_MULTI_ENUM_CONVERTER(
    WKDataDetectorTypes,
    (@{
      @"phoneNumber" : @(WKDataDetectorTypePhoneNumber),
      @"link" : @(WKDataDetectorTypeLink),
      @"address" : @(WKDataDetectorTypeAddress),
      @"calendarEvent" : @(WKDataDetectorTypeCalendarEvent),
      @"trackingNumber" : @(WKDataDetectorTypeTrackingNumber),
      @"flightNumber" : @(WKDataDetectorTypeFlightNumber),
      @"lookupSuggestion" : @(WKDataDetectorTypeLookupSuggestion),
      @"none" : @(WKDataDetectorTypeNone),
      @"all" : @(WKDataDetectorTypeAll),
    }),
    WKDataDetectorTypePhoneNumber,
    unsignedLongLongValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    UIKeyboardAppearance,
    (@{
      @"default" : @(UIKeyboardAppearanceDefault),
      @"light" : @(UIKeyboardAppearanceLight),
      @"dark" : @(UIKeyboardAppearanceDark),
    }),
    UIKeyboardAppearanceDefault,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    UIReturnKeyType,
    (@{
      @"default" : @(UIReturnKeyDefault),
      @"go" : @(UIReturnKeyGo),
      @"google" : @(UIReturnKeyGoogle),
      @"join" : @(UIReturnKeyJoin),
      @"next" : @(UIReturnKeyNext),
      @"route" : @(UIReturnKeyRoute),
      @"search" : @(UIReturnKeySearch),
      @"send" : @(UIReturnKeySend),
      @"yahoo" : @(UIReturnKeyYahoo),
      @"done" : @(UIReturnKeyDone),
      @"emergency-call" : @(UIReturnKeyEmergencyCall),
    }),
    UIReturnKeyDefault,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    UIUserInterfaceStyle,
    (@{
      @"unspecified" : @(UIUserInterfaceStyleUnspecified),
      @"light" : @(UIUserInterfaceStyleLight),
      @"dark" : @(UIUserInterfaceStyleDark),
    }),
    UIUserInterfaceStyleUnspecified,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    UIViewContentMode,
    (@{
      @"scale-to-fill" : @(UIViewContentModeScaleToFill),
      @"scale-aspect-fit" : @(UIViewContentModeScaleAspectFit),
      @"scale-aspect-fill" : @(UIViewContentModeScaleAspectFill),
      @"redraw" : @(UIViewContentModeRedraw),
      @"center" : @(UIViewContentModeCenter),
      @"top" : @(UIViewContentModeTop),
      @"bottom" : @(UIViewContentModeBottom),
      @"left" : @(UIViewContentModeLeft),
      @"right" : @(UIViewContentModeRight),
      @"top-left" : @(UIViewContentModeTopLeft),
      @"top-right" : @(UIViewContentModeTopRight),
      @"bottom-left" : @(UIViewContentModeBottomLeft),
      @"bottom-right" : @(UIViewContentModeBottomRight),
      // Cross-platform values
      @"cover" : @(UIViewContentModeScaleAspectFill),
      @"contain" : @(UIViewContentModeScaleAspectFit),
      @"stretch" : @(UIViewContentModeScaleToFill),
    }),
    UIViewContentModeScaleAspectFill,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    UIBarStyle,
    (@{
      @"default" : @(UIBarStyleDefault),
      @"black" : @(UIBarStyleBlack),
      @"blackOpaque" : @(UIBarStyleBlackOpaque),
      @"blackTranslucent" : @(UIBarStyleBlackTranslucent),
    }),
    UIBarStyleDefault,
    integerValue)

static void convertCGStruct(const char *type, NSArray *fields, CGFloat *result, id json)
{
  NSUInteger count = fields.count;
  if ([json isKindOfClass:[NSArray class]]) {
    if (ABI49_0_0RCT_DEBUG && [json count] != count) {
      ABI49_0_0RCTLogInfo(
          @"Expected array with count %llu, but count is %llu: %@",
          (unsigned long long)count,
          (unsigned long long)[json count],
          json);
    } else {
      for (NSUInteger i = 0; i < count; i++) {
        result[i] = [ABI49_0_0RCTConvert CGFloat:ABI49_0_0RCTNilIfNull(json[i])];
      }
    }
  } else if ([json isKindOfClass:[NSDictionary class]]) {
    for (NSUInteger i = 0; i < count; i++) {
      result[i] = [ABI49_0_0RCTConvert CGFloat:ABI49_0_0RCTNilIfNull(json[fields[i]])];
    }
  } else if (json) {
    ABI49_0_0RCTLogConvertError(json, @(type));
  }
}

/**
 * This macro is used for creating converter functions for structs that consist
 * of a number of CGFloat properties, such as CGPoint, CGRect, etc.
 */
#define ABI49_0_0RCT_CGSTRUCT_CONVERTER(type, values)                  \
  +(type)type : (id)json                                      \
  {                                                           \
    static NSArray *fields;                                   \
    static dispatch_once_t onceToken;                         \
    dispatch_once(&onceToken, ^{                              \
      fields = values;                                        \
    });                                                       \
    type result;                                              \
    convertCGStruct(#type, fields, (CGFloat *)&result, json); \
    return result;                                            \
  }

ABI49_0_0RCT_CUSTOM_CONVERTER(CGFloat, CGFloat, [self double:json])

ABI49_0_0RCT_CGSTRUCT_CONVERTER(CGPoint, (@[ @"x", @"y" ]))
ABI49_0_0RCT_CGSTRUCT_CONVERTER(CGSize, (@[ @"width", @"height" ]))
ABI49_0_0RCT_CGSTRUCT_CONVERTER(CGRect, (@[ @"x", @"y", @"width", @"height" ]))

+ (UIEdgeInsets)UIEdgeInsets:(id)json
{
  static NSArray *fields;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    fields = @[ @"top", @"left", @"bottom", @"right" ];
  });

  if ([json isKindOfClass:[NSNumber class]]) {
    CGFloat value = [json doubleValue];
    return UIEdgeInsetsMake(value, value, value, value);
  } else {
    UIEdgeInsets result;
    convertCGStruct("UIEdgeInsets", fields, (CGFloat *)&result, json);
    return result;
  }
}

ABI49_0_0RCT_ENUM_CONVERTER(
    CGLineJoin,
    (@{
      @"miter" : @(kCGLineJoinMiter),
      @"round" : @(kCGLineJoinRound),
      @"bevel" : @(kCGLineJoinBevel),
    }),
    kCGLineJoinMiter,
    intValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    CGLineCap,
    (@{
      @"butt" : @(kCGLineCapButt),
      @"round" : @(kCGLineCapRound),
      @"square" : @(kCGLineCapSquare),
    }),
    kCGLineCapButt,
    intValue)

ABI49_0_0RCT_CGSTRUCT_CONVERTER(CGAffineTransform, (@[ @"a", @"b", @"c", @"d", @"tx", @"ty" ]))

static NSString *const ABI49_0_0RCTFallback = @"fallback";
static NSString *const ABI49_0_0RCTFallbackARGB = @"fallback-argb";
static NSString *const ABI49_0_0RCTSelector = @"selector";
static NSString *const ABI49_0_0RCTIndex = @"index";

/** The following dictionary defines the ABI49_0_0React-native semantic colors for ios.
 *  If the value for a given name is empty then the name itself
 *  is used as the UIColor selector.
 *  If the ABI49_0_0RCTSelector key is present then that value is used for a selector instead
 *  of the key name.
 *  If the given selector is not available on the running OS version then
 *  the ABI49_0_0RCTFallback selector is used instead.
 *  If the ABI49_0_0RCTIndex key is present then object returned from UIColor is an
 *  NSArray and the object at index ABI49_0_0RCTIndex is to be used.
 */
static NSDictionary<NSString *, NSDictionary *> *ABI49_0_0RCTSemanticColorsMap()
{
  static NSDictionary<NSString *, NSDictionary *> *colorMap = nil;
  if (colorMap == nil) {
    NSMutableDictionary<NSString *, NSDictionary *> *map = [@{
      // https://developer.apple.com/documentation/uikit/uicolor/ui_element_colors
      // Label Colors
      @"labelColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB :
            @(0xFF000000) // fallback for iOS<=12: RGBA returned by this semantic color in light mode on iOS 13
      },
      @"secondaryLabelColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0x993c3c43)
      },
      @"tertiaryLabelColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0x4c3c3c43)
      },
      @"quaternaryLabelColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0x2d3c3c43)
      },
      // Fill Colors
      @"systemFillColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0x33787880)
      },
      @"secondarySystemFillColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0x28787880)
      },
      @"tertiarySystemFillColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0x1e767680)
      },
      @"quaternarySystemFillColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0x14747480)
      },
      // Text Colors
      @"placeholderTextColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0x4c3c3c43)
      },
      // Standard Content Background Colors
      @"systemBackgroundColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFffffff)
      },
      @"secondarySystemBackgroundColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFf2f2f7)
      },
      @"tertiarySystemBackgroundColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFffffff)
      },
      // Grouped Content Background Colors
      @"systemGroupedBackgroundColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFf2f2f7)
      },
      @"secondarySystemGroupedBackgroundColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFffffff)
      },
      @"tertiarySystemGroupedBackgroundColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFf2f2f7)
      },
      // Separator Colors
      @"separatorColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0x493c3c43)
      },
      @"opaqueSeparatorColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFc6c6c8)
      },
      // Link Color
      @"linkColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFF007aff)
      },
      // Nonadaptable Colors
      @"darkTextColor" : @{},
      @"lightTextColor" : @{},
      // https://developer.apple.com/documentation/uikit/uicolor/standard_colors
      // Adaptable Colors
      @"systemBlueColor" : @{},
      @"systemBrownColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFa2845e)
      },
      @"systemGreenColor" : @{},
      @"systemIndigoColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFF5856d6)
      },
      @"systemOrangeColor" : @{},
      @"systemPinkColor" : @{},
      @"systemPurpleColor" : @{},
      @"systemRedColor" : @{},
      @"systemTealColor" : @{},
      @"systemYellowColor" : @{},
      // Adaptable Gray Colors
      @"systemGrayColor" : @{},
      @"systemGray2Color" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFaeaeb2)
      },
      @"systemGray3Color" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFc7c7cc)
      },
      @"systemGray4Color" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFd1d1d6)
      },
      @"systemGray5Color" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFe5e5ea)
      },
      @"systemGray6Color" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0xFFf2f2f7)
      },
      // Transparent Color
      @"clearColor" : @{
        // iOS 13.0
        ABI49_0_0RCTFallbackARGB : @(0x00000000)
      },
    } mutableCopy];
    // The color names are the Objective-C UIColor selector names,
    // but Swift selector names are valid as well, so make aliases.
    static NSString *const ABI49_0_0RCTColorSuffix = @"Color";
    NSMutableDictionary<NSString *, NSDictionary *> *aliases = [NSMutableDictionary new];
    for (NSString *objcSelector in map) {
      ABI49_0_0RCTAssert(
          [objcSelector hasSuffix:ABI49_0_0RCTColorSuffix], @"A selector in the color map did not end with the suffix Color.");
      NSMutableDictionary *entry = [map[objcSelector] mutableCopy];
      ABI49_0_0RCTAssert([entry objectForKey:ABI49_0_0RCTSelector] == nil, @"Entry should not already have an ABI49_0_0RCTSelector");
      NSString *swiftSelector = [objcSelector substringToIndex:[objcSelector length] - [ABI49_0_0RCTColorSuffix length]];
      entry[ABI49_0_0RCTSelector] = objcSelector;
      aliases[swiftSelector] = entry;
    }
    [map addEntriesFromDictionary:aliases];
#if DEBUG
    [map addEntriesFromDictionary:@{
      // The follow exist for Unit Tests
      @"unitTestFallbackColor" : @{ABI49_0_0RCTFallback : @"gridColor"},
      @"unitTestFallbackColorIOS" : @{ABI49_0_0RCTFallback : @"blueColor"},
      @"unitTestFallbackColorEven" : @{
        ABI49_0_0RCTSelector : @"unitTestFallbackColorEven",
        ABI49_0_0RCTIndex : @0,
        ABI49_0_0RCTFallback : @"controlAlternatingRowBackgroundColors"
      },
      @"unitTestFallbackColorOdd" : @{
        ABI49_0_0RCTSelector : @"unitTestFallbackColorOdd",
        ABI49_0_0RCTIndex : @1,
        ABI49_0_0RCTFallback : @"controlAlternatingRowBackgroundColors"
      },
    }];
#endif
    colorMap = [map copy];
  }

  return colorMap;
}

/** Returns a UIColor based on a semantic color name.
 *  Returns nil if the semantic color name is invalid.
 */
static UIColor *ABI49_0_0RCTColorFromSemanticColorName(NSString *semanticColorName)
{
  NSDictionary<NSString *, NSDictionary *> *colorMap = ABI49_0_0RCTSemanticColorsMap();
  UIColor *color = nil;
  NSDictionary<NSString *, id> *colorInfo = colorMap[semanticColorName];
  if (colorInfo) {
    NSString *semanticColorSelector = colorInfo[ABI49_0_0RCTSelector];
    if (semanticColorSelector == nil) {
      semanticColorSelector = semanticColorName;
    }
    SEL selector = NSSelectorFromString(semanticColorSelector);
    if (![UIColor respondsToSelector:selector]) {
      NSNumber *fallbackRGB = colorInfo[ABI49_0_0RCTFallbackARGB];
      if (fallbackRGB != nil) {
        ABI49_0_0RCTAssert([fallbackRGB isKindOfClass:[NSNumber class]], @"fallback ARGB is not a number");
        return [ABI49_0_0RCTConvert UIColor:fallbackRGB];
      }
      semanticColorSelector = colorInfo[ABI49_0_0RCTFallback];
      selector = NSSelectorFromString(semanticColorSelector);
    }
    ABI49_0_0RCTAssert([UIColor respondsToSelector:selector], @"ABI49_0_0RCTUIColor does not respond to a semantic color selector.");
    Class klass = [UIColor class];
    IMP imp = [klass methodForSelector:selector];
    id (*getSemanticColorObject)(id, SEL) = (void *)imp;
    id colorObject = getSemanticColorObject(klass, selector);
    if ([colorObject isKindOfClass:[UIColor class]]) {
      color = colorObject;
    } else if ([colorObject isKindOfClass:[NSArray class]]) {
      NSArray *colors = colorObject;
      NSNumber *index = colorInfo[ABI49_0_0RCTIndex];
      ABI49_0_0RCTAssert(index, @"index should not be null");
      color = colors[[index unsignedIntegerValue]];
    } else {
      ABI49_0_0RCTAssert(false, @"selector return an unknown object type");
    }
  }
  return color;
}

/** Returns an alphabetically sorted comma separated list of the valid semantic color names
 */
static NSString *ABI49_0_0RCTSemanticColorNames()
{
  NSMutableString *names = [NSMutableString new];
  NSDictionary<NSString *, NSDictionary *> *colorMap = ABI49_0_0RCTSemanticColorsMap();
  NSArray *allKeys =
      [[[colorMap allKeys] mutableCopy] sortedArrayUsingSelector:@selector(localizedCaseInsensitiveCompare:)];

  for (id key in allKeys) {
    if ([names length]) {
      [names appendString:@", "];
    }
    [names appendString:key];
  }
  return names;
}

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
  } else if ([json isKindOfClass:[NSDictionary class]]) {
    NSDictionary *dictionary = json;
    id value = nil;
    if ((value = [dictionary objectForKey:@"semantic"])) {
      if ([value isKindOfClass:[NSString class]]) {
        NSString *semanticName = value;
        UIColor *color = [UIColor colorNamed:semanticName];
        if (color != nil) {
          return color;
        }
        color = ABI49_0_0RCTColorFromSemanticColorName(semanticName);
        if (color == nil) {
          ABI49_0_0RCTLogConvertError(
              json,
              [@"a UIColor.  Expected one of the following values: " stringByAppendingString:ABI49_0_0RCTSemanticColorNames()]);
        }
        return color;
      } else if ([value isKindOfClass:[NSArray class]]) {
        for (id name in value) {
          UIColor *color = [UIColor colorNamed:name];
          if (color != nil) {
            return color;
          }
          color = ABI49_0_0RCTColorFromSemanticColorName(name);
          if (color != nil) {
            return color;
          }
        }
        ABI49_0_0RCTLogConvertError(
            json,
            [@"a UIColor.  None of the names in the array were one of the following values: "
                stringByAppendingString:ABI49_0_0RCTSemanticColorNames()]);
        return nil;
      }
      ABI49_0_0RCTLogConvertError(
          json, @"a UIColor.  Expected either a single name or an array of names but got something else.");
      return nil;
    } else if ((value = [dictionary objectForKey:@"dynamic"])) {
      NSDictionary *appearances = value;
      id light = [appearances objectForKey:@"light"];
      UIColor *lightColor = [ABI49_0_0RCTConvert UIColor:light];
      id dark = [appearances objectForKey:@"dark"];
      UIColor *darkColor = [ABI49_0_0RCTConvert UIColor:dark];
      id highContrastLight = [appearances objectForKey:@"highContrastLight"];
      UIColor *highContrastLightColor = [ABI49_0_0RCTConvert UIColor:highContrastLight];
      id highContrastDark = [appearances objectForKey:@"highContrastDark"];
      UIColor *highContrastDarkColor = [ABI49_0_0RCTConvert UIColor:highContrastDark];
      if (lightColor != nil && darkColor != nil) {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
        if (@available(iOS 13.0, *)) {
          UIColor *color = [UIColor colorWithDynamicProvider:^UIColor *_Nonnull(
                                        UITraitCollection *_Nonnull collection) {
            if (collection.userInterfaceStyle == UIUserInterfaceStyleDark) {
              if (collection.accessibilityContrast == UIAccessibilityContrastHigh && highContrastDarkColor != nil) {
                return highContrastDarkColor;
              } else {
                return darkColor;
              }
            } else {
              if (collection.accessibilityContrast == UIAccessibilityContrastHigh && highContrastLightColor != nil) {
                return highContrastLightColor;
              } else {
                return lightColor;
              }
            }
          }];
          return color;
        } else {
#endif
          return lightColor;
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
        }
#endif
      } else {
        ABI49_0_0RCTLogConvertError(json, @"a UIColor. Expected an iOS dynamic appearance aware color.");
        return nil;
      }
    } else {
      ABI49_0_0RCTLogConvertError(json, @"a UIColor. Expected an iOS semantic color or dynamic appearance aware color.");
      return nil;
    }
  } else {
    ABI49_0_0RCTLogConvertError(json, @"a UIColor. Did you forget to call processColor() on the JS side?");
    return nil;
  }
}

+ (CGColorRef)CGColor:(id)json
{
  return [self UIColor:json].CGColor;
}

+ (ABI49_0_0YGValue)ABI49_0_0YGValue:(id)json
{
  if (!json) {
    return ABI49_0_0YGValueUndefined;
  } else if ([json isKindOfClass:[NSNumber class]]) {
    return (ABI49_0_0YGValue){[json floatValue], ABI49_0_0YGUnitPoint};
  } else if ([json isKindOfClass:[NSString class]]) {
    NSString *s = (NSString *)json;
    if ([s isEqualToString:@"auto"]) {
      return (ABI49_0_0YGValue){ABI49_0_0YGUndefined, ABI49_0_0YGUnitAuto};
    } else if ([s hasSuffix:@"%"]) {
      float floatValue;
      if ([[NSScanner scannerWithString:s] scanFloat:&floatValue]) {
        return (ABI49_0_0YGValue){floatValue, ABI49_0_0YGUnitPercent};
      }
    } else {
      ABI49_0_0RCTLogAdvice(
          @"\"%@\" is not a valid dimension. Dimensions must be a number, \"auto\", or a string suffixed with \"%%\".",
          s);
    }
  }
  return ABI49_0_0YGValueUndefined;
}

NSArray *ABI49_0_0RCTConvertArrayValue(SEL type, id json)
{
  __block BOOL copy = NO;
  __block NSArray *values = json = [ABI49_0_0RCTConvert NSArray:json];
  [json enumerateObjectsUsingBlock:^(id jsonValue, NSUInteger idx, __unused BOOL *stop) {
    id value = ((id(*)(Class, SEL, id))objc_msgSend)([ABI49_0_0RCTConvert class], type, jsonValue);
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

ABI49_0_0RCT_ARRAY_CONVERTER(NSURL)
ABI49_0_0RCT_ARRAY_CONVERTER(ABI49_0_0RCTFileURL)
ABI49_0_0RCT_ARRAY_CONVERTER(UIColor)

/**
 * This macro is used for creating converter functions for directly
 * representable json array values that require no conversion.
 */
#if ABI49_0_0RCT_DEBUG
#define ABI49_0_0RCT_JSON_ARRAY_CONVERTER_NAMED(type, name) ABI49_0_0RCT_ARRAY_CONVERTER_NAMED(type, name)
#else
#define ABI49_0_0RCT_JSON_ARRAY_CONVERTER_NAMED(type, name) \
  +(NSArray *)name##Array : (id)json               \
  {                                                \
    return json;                                   \
  }
#endif
#define ABI49_0_0RCT_JSON_ARRAY_CONVERTER(type) ABI49_0_0RCT_JSON_ARRAY_CONVERTER_NAMED(type, type)

ABI49_0_0RCT_JSON_ARRAY_CONVERTER(NSArray)
ABI49_0_0RCT_JSON_ARRAY_CONVERTER(NSString)
ABI49_0_0RCT_JSON_ARRAY_CONVERTER_NAMED(NSArray<NSString *>, NSStringArray)
ABI49_0_0RCT_JSON_ARRAY_CONVERTER(NSDictionary)
ABI49_0_0RCT_JSON_ARRAY_CONVERTER(NSNumber)

// Can't use ABI49_0_0RCT_ARRAY_CONVERTER due to bridged cast
+ (NSArray *)CGColorArray:(id)json
{
  NSMutableArray *colors = [NSMutableArray new];
  for (id value in [self NSArray:json]) {
    [colors addObject:(__bridge id)[self CGColor:value]];
  }
  return colors;
}

static id ABI49_0_0RCTConvertPropertyListValue(id json)
{
  if (!json || json == (id)kCFNull) {
    return nil;
  }

  if ([json isKindOfClass:[NSDictionary class]]) {
    __block BOOL copy = NO;
    NSMutableDictionary *values = [[NSMutableDictionary alloc] initWithCapacity:[json count]];
    [json enumerateKeysAndObjectsUsingBlock:^(NSString *key, id jsonValue, __unused BOOL *stop) {
      id value = ABI49_0_0RCTConvertPropertyListValue(jsonValue);
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
      id value = ABI49_0_0RCTConvertPropertyListValue(jsonValue);
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
  return ABI49_0_0RCTConvertPropertyListValue(json);
}

ABI49_0_0RCT_ENUM_CONVERTER(css_backface_visibility_t, (@{@"hidden" : @NO, @"visible" : @YES}), YES, boolValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0YGOverflow,
    (@{
      @"hidden" : @(ABI49_0_0YGOverflowHidden),
      @"visible" : @(ABI49_0_0YGOverflowVisible),
      @"scroll" : @(ABI49_0_0YGOverflowScroll),
    }),
    ABI49_0_0YGOverflowVisible,
    intValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0YGDisplay,
    (@{
      @"flex" : @(ABI49_0_0YGDisplayFlex),
      @"none" : @(ABI49_0_0YGDisplayNone),
    }),
    ABI49_0_0YGDisplayFlex,
    intValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0YGFlexDirection,
    (@{
      @"row" : @(ABI49_0_0YGFlexDirectionRow),
      @"row-reverse" : @(ABI49_0_0YGFlexDirectionRowReverse),
      @"column" : @(ABI49_0_0YGFlexDirectionColumn),
      @"column-reverse" : @(ABI49_0_0YGFlexDirectionColumnReverse)
    }),
    ABI49_0_0YGFlexDirectionColumn,
    intValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0YGJustify,
    (@{
      @"flex-start" : @(ABI49_0_0YGJustifyFlexStart),
      @"flex-end" : @(ABI49_0_0YGJustifyFlexEnd),
      @"center" : @(ABI49_0_0YGJustifyCenter),
      @"space-between" : @(ABI49_0_0YGJustifySpaceBetween),
      @"space-around" : @(ABI49_0_0YGJustifySpaceAround),
      @"space-evenly" : @(ABI49_0_0YGJustifySpaceEvenly)
    }),
    ABI49_0_0YGJustifyFlexStart,
    intValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0YGAlign,
    (@{
      @"flex-start" : @(ABI49_0_0YGAlignFlexStart),
      @"flex-end" : @(ABI49_0_0YGAlignFlexEnd),
      @"center" : @(ABI49_0_0YGAlignCenter),
      @"auto" : @(ABI49_0_0YGAlignAuto),
      @"stretch" : @(ABI49_0_0YGAlignStretch),
      @"baseline" : @(ABI49_0_0YGAlignBaseline),
      @"space-between" : @(ABI49_0_0YGAlignSpaceBetween),
      @"space-around" : @(ABI49_0_0YGAlignSpaceAround)
    }),
    ABI49_0_0YGAlignFlexStart,
    intValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0YGDirection,
    (@{
      @"inherit" : @(ABI49_0_0YGDirectionInherit),
      @"ltr" : @(ABI49_0_0YGDirectionLTR),
      @"rtl" : @(ABI49_0_0YGDirectionRTL),
    }),
    ABI49_0_0YGDirectionInherit,
    intValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0YGPositionType,
    (@{
      @"static" : @(ABI49_0_0YGPositionTypeStatic),
      @"absolute" : @(ABI49_0_0YGPositionTypeAbsolute),
      @"relative" : @(ABI49_0_0YGPositionTypeRelative)
    }),
    ABI49_0_0YGPositionTypeRelative,
    intValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0YGWrap,
    (@{@"wrap" : @(ABI49_0_0YGWrapWrap), @"nowrap" : @(ABI49_0_0YGWrapNoWrap), @"wrap-reverse" : @(ABI49_0_0YGWrapWrapReverse)}),
    ABI49_0_0YGWrapNoWrap,
    intValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0RCTPointerEvents,
    (@{
      @"none" : @(ABI49_0_0RCTPointerEventsNone),
      @"box-only" : @(ABI49_0_0RCTPointerEventsBoxOnly),
      @"box-none" : @(ABI49_0_0RCTPointerEventsBoxNone),
      @"auto" : @(ABI49_0_0RCTPointerEventsUnspecified)
    }),
    ABI49_0_0RCTPointerEventsUnspecified,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0RCTAnimationType,
    (@{
      @"spring" : @(ABI49_0_0RCTAnimationTypeSpring),
      @"linear" : @(ABI49_0_0RCTAnimationTypeLinear),
      @"easeIn" : @(ABI49_0_0RCTAnimationTypeEaseIn),
      @"easeOut" : @(ABI49_0_0RCTAnimationTypeEaseOut),
      @"easeInEaseOut" : @(ABI49_0_0RCTAnimationTypeEaseInEaseOut),
      @"keyboard" : @(ABI49_0_0RCTAnimationTypeKeyboard),
    }),
    ABI49_0_0RCTAnimationTypeEaseInEaseOut,
    integerValue)

@end

@interface ABI49_0_0RCTImageSource (Packager)

@property (nonatomic, assign) BOOL packagerAsset;

@end

@implementation ABI49_0_0RCTConvert (Deprecated)

/* This method is only used when loading images synchronously, e.g. for tabbar icons */
+ (UIImage *)UIImage:(id)json
{
  if (!json) {
    return nil;
  }

  ABI49_0_0RCTImageSource *imageSource = [self ABI49_0_0RCTImageSource:json];
  if (!imageSource) {
    return nil;
  }

  __block UIImage *image;
  if (!ABI49_0_0RCTIsMainQueue()) {
    // It seems that none of the UIImage loading methods can be guaranteed
    // thread safe, so we'll pick the lesser of two evils here and block rather
    // than run the risk of crashing
    ABI49_0_0RCTLogWarn(@"Calling [ABI49_0_0RCTConvert UIImage:] on a background thread is not recommended");
    ABI49_0_0RCTUnsafeExecuteOnMainQueueSync(^{
      image = [self UIImage:json];
    });
    return image;
  }

  NSURL *URL = imageSource.request.URL;
  NSString *scheme = URL.scheme.lowercaseString;
  if ([scheme isEqualToString:@"file"]) {
    image = ABI49_0_0RCTImageFromLocalAssetURL(URL);
    // There is a case where this may fail when the image is at the bundle location.
    // ABI49_0_0RCTImageFromLocalAssetURL only checks for the image in the same location as the jsbundle
    // Hence, if the bundle is CodePush-ed, it will not be able to find the image.
    // This check is added here instead of being inside ABI49_0_0RCTImageFromLocalAssetURL, since
    // we don't want breaking changes to ABI49_0_0RCTImageFromLocalAssetURL, which is called in a lot of places
    // This is a deprecated method, and hence has the least impact on existing code. Basically,
    // instead of crashing the app, it tries one more location for the image.
    if (!image) {
      image = ABI49_0_0RCTImageFromLocalBundleAssetURL(URL);
    }
    if (!image) {
      ABI49_0_0RCTLogConvertError(json, @"an image. File not found.");
    }
  } else if ([scheme isEqualToString:@"data"]) {
    image = [UIImage imageWithData:[NSData dataWithContentsOfURL:URL]];
  } else if ([scheme isEqualToString:@"http"] && imageSource.packagerAsset) {
    image = [UIImage imageWithData:[NSData dataWithContentsOfURL:URL]];
  } else {
    ABI49_0_0RCTLogConvertError(json, @"an image. Only local files or data URIs are supported.");
    return nil;
  }

  CGFloat scale = imageSource.scale;
  if (!scale && imageSource.size.width) {
    // If no scale provided, set scale to image width / source width
    scale = CGImageGetWidth(image.CGImage) / imageSource.size.width;
  }

  if (scale) {
    image = [UIImage imageWithCGImage:image.CGImage scale:scale orientation:image.imageOrientation];
  }

  if (!CGSizeEqualToSize(imageSource.size, CGSizeZero) && !CGSizeEqualToSize(imageSource.size, image.size)) {
    ABI49_0_0RCTLogInfo(
        @"Image source %@ size %@ does not match loaded image size %@.",
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
