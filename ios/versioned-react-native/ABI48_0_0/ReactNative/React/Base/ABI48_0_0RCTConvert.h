/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTAnimationType.h>
#import <ABI48_0_0React/ABI48_0_0RCTBorderCurve.h>
#import <ABI48_0_0React/ABI48_0_0RCTBorderStyle.h>
#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>
#import <ABI48_0_0React/ABI48_0_0RCTLog.h>
#import <ABI48_0_0React/ABI48_0_0RCTPointerEvents.h>
#import <ABI48_0_0React/ABI48_0_0RCTTextDecorationLineType.h>
#import <ABI48_0_0yoga/ABI48_0_0Yoga.h>
#if TARGET_OS_IPHONE
#import <WebKit/WebKit.h>
#endif

/**
 * This class provides a collection of conversion functions for mapping
 * JSON objects to native types and classes. These are useful when writing
 * custom ABI48_0_0RCTViewManager setter methods.
 */
@interface ABI48_0_0RCTConvert : NSObject

+ (id)id:(id)json;

+ (BOOL)BOOL:(id)json;
+ (double)double:(id)json;
+ (float)float:(id)json;
+ (int)int:(id)json;

+ (int64_t)int64_t:(id)json;
+ (uint64_t)uint64_t:(id)json;

+ (NSInteger)NSInteger:(id)json;
+ (NSUInteger)NSUInteger:(id)json;

+ (NSArray *)NSArray:(id)json;
+ (NSDictionary *)NSDictionary:(id)json;
+ (NSString *)NSString:(id)json;
+ (NSNumber *)NSNumber:(id)json;

+ (NSSet *)NSSet:(id)json;
+ (NSData *)NSData:(id)json;
+ (NSIndexSet *)NSIndexSet:(id)json;

+ (NSURLRequestCachePolicy)NSURLRequestCachePolicy:(id)json;
+ (NSURL *)NSURL:(id)json;
+ (NSURLRequest *)NSURLRequest:(id)json;

typedef NSURL ABI48_0_0RCTFileURL;
+ (ABI48_0_0RCTFileURL *)ABI48_0_0RCTFileURL:(id)json;

+ (NSDate *)NSDate:(id)json;
+ (NSLocale *)NSLocale:(id)json;
+ (NSTimeZone *)NSTimeZone:(id)json;
+ (NSTimeInterval)NSTimeInterval:(id)json;

+ (NSLineBreakMode)NSLineBreakMode:(id)json;
+ (NSTextAlignment)NSTextAlignment:(id)json;
+ (NSUnderlineStyle)NSUnderlineStyle:(id)json;
+ (NSWritingDirection)NSWritingDirection:(id)json;
+ (NSLineBreakStrategy)NSLineBreakStrategy:(id)json;
+ (UITextAutocapitalizationType)UITextAutocapitalizationType:(id)json;
+ (UITextFieldViewMode)UITextFieldViewMode:(id)json;
+ (UIKeyboardType)UIKeyboardType:(id)json;
+ (UIKeyboardAppearance)UIKeyboardAppearance:(id)json;
+ (UIReturnKeyType)UIReturnKeyType:(id)json;
#if !TARGET_OS_TV
+ (UIDataDetectorTypes)UIDataDetectorTypes:(id)json;
#endif

#if TARGET_OS_IPHONE
+ (WKDataDetectorTypes)WKDataDetectorTypes:(id)json;
#endif

+ (UIViewContentMode)UIViewContentMode:(id)json;
#if !TARGET_OS_TV
+ (UIBarStyle)UIBarStyle:(id)json;
#endif

+ (CGFloat)CGFloat:(id)json;
+ (CGPoint)CGPoint:(id)json;
+ (CGSize)CGSize:(id)json;
+ (CGRect)CGRect:(id)json;
+ (UIEdgeInsets)UIEdgeInsets:(id)json;

+ (CGLineCap)CGLineCap:(id)json;
+ (CGLineJoin)CGLineJoin:(id)json;

+ (CGAffineTransform)CGAffineTransform:(id)json;

+ (UIColor *)UIColor:(id)json;
+ (CGColorRef)CGColor:(id)json CF_RETURNS_NOT_RETAINED;

+ (ABI48_0_0YGValue)ABI48_0_0YGValue:(id)json;

+ (NSArray<NSArray *> *)NSArrayArray:(id)json;
+ (NSArray<NSString *> *)NSStringArray:(id)json;
+ (NSArray<NSArray<NSString *> *> *)NSStringArrayArray:(id)json;
+ (NSArray<NSDictionary *> *)NSDictionaryArray:(id)json;
+ (NSArray<NSURL *> *)NSURLArray:(id)json;
+ (NSArray<ABI48_0_0RCTFileURL *> *)ABI48_0_0RCTFileURLArray:(id)json;
+ (NSArray<NSNumber *> *)NSNumberArray:(id)json;
+ (NSArray<UIColor *> *)UIColorArray:(id)json;

typedef NSArray CGColorArray;
+ (CGColorArray *)CGColorArray:(id)json;

/**
 * Convert a JSON object to a Plist-safe equivalent by stripping null values.
 */
typedef id NSPropertyList;
+ (NSPropertyList)NSPropertyList:(id)json;

typedef BOOL css_backface_visibility_t;
+ (ABI48_0_0YGOverflow)ABI48_0_0YGOverflow:(id)json;
+ (ABI48_0_0YGDisplay)ABI48_0_0YGDisplay:(id)json;
+ (css_backface_visibility_t)css_backface_visibility_t:(id)json;
+ (ABI48_0_0YGFlexDirection)ABI48_0_0YGFlexDirection:(id)json;
+ (ABI48_0_0YGJustify)ABI48_0_0YGJustify:(id)json;
+ (ABI48_0_0YGAlign)ABI48_0_0YGAlign:(id)json;
+ (ABI48_0_0YGPositionType)ABI48_0_0YGPositionType:(id)json;
+ (ABI48_0_0YGWrap)ABI48_0_0YGWrap:(id)json;
+ (ABI48_0_0YGDirection)ABI48_0_0YGDirection:(id)json;

+ (ABI48_0_0RCTPointerEvents)ABI48_0_0RCTPointerEvents:(id)json;
+ (ABI48_0_0RCTAnimationType)ABI48_0_0RCTAnimationType:(id)json;
+ (ABI48_0_0RCTBorderStyle)ABI48_0_0RCTBorderStyle:(id)json;
+ (ABI48_0_0RCTBorderCurve)ABI48_0_0RCTBorderCurve:(id)json;
+ (ABI48_0_0RCTTextDecorationLineType)ABI48_0_0RCTTextDecorationLineType:(id)json;

@end

@interface ABI48_0_0RCTConvert (Deprecated)

/**
 * Use lightweight generics syntax instead, e.g. NSArray<NSString *>
 */
typedef NSArray NSArrayArray __deprecated_msg("Use NSArray<NSArray *>");
typedef NSArray NSStringArray __deprecated_msg("Use NSArray<NSString *>");
typedef NSArray NSStringArrayArray __deprecated_msg("Use NSArray<NSArray<NSString *> *>");
typedef NSArray NSDictionaryArray __deprecated_msg("Use NSArray<NSDictionary *>");
typedef NSArray NSURLArray __deprecated_msg("Use NSArray<NSURL *>");
typedef NSArray ABI48_0_0RCTFileURLArray __deprecated_msg("Use NSArray<ABI48_0_0RCTFileURL *>");
typedef NSArray NSNumberArray __deprecated_msg("Use NSArray<NSNumber *>");
typedef NSArray UIColorArray __deprecated_msg("Use NSArray<UIColor *>");

/**
 * Synchronous image loading is generally a bad idea for performance reasons.
 * If you need to pass image references, try to use `ABI48_0_0RCTImageSource` and then
 * `ABI48_0_0RCTImageLoader` instead of converting directly to a UIImage.
 */
+ (UIImage *)UIImage:(id)json;
+ (CGImageRef)CGImage:(id)json CF_RETURNS_NOT_RETAINED;

@end

/**
 * Underlying implementations of ABI48_0_0RCT_XXX_CONVERTER macros. Ignore these.
 */
ABI48_0_0RCT_EXTERN NSNumber *ABI48_0_0RCTConvertEnumValue(const char *, NSDictionary *, NSNumber *, id);
ABI48_0_0RCT_EXTERN NSNumber *ABI48_0_0RCTConvertMultiEnumValue(const char *, NSDictionary *, NSNumber *, id);
ABI48_0_0RCT_EXTERN NSArray *ABI48_0_0RCTConvertArrayValue(SEL, id);

/**
 * This macro is used for logging conversion errors. This is just used to
 * avoid repeating the same boilerplate for every error message.
 */
#define ABI48_0_0RCTLogConvertError(json, typeName) \
  ABI48_0_0RCTLogError(@"JSON value '%@' of type %@ cannot be converted to %@", json, [json classForCoder], typeName)

/**
 * This macro is used for creating simple converter functions that just call
 * the specified getter method on the json value.
 */
#define ABI48_0_0RCT_CONVERTER(type, name, getter) ABI48_0_0RCT_CUSTOM_CONVERTER(type, name, [json getter])

/**
 * This macro is used for creating converter functions with arbitrary logic.
 */
#define ABI48_0_0RCT_CUSTOM_CONVERTER(type, name, code) \
  +(type)name : (id)json ABI48_0_0RCT_DYNAMIC           \
  {                                            \
    if (!ABI48_0_0RCT_DEBUG) {                          \
      return code;                             \
    } else {                                   \
      @try {                                   \
        return code;                           \
      } @catch (__unused NSException * e) {    \
        ABI48_0_0RCTLogConvertError(json, @ #type);     \
        json = nil;                            \
        return code;                           \
      }                                        \
    }                                          \
  }

/**
 * This macro is similar to ABI48_0_0RCT_CONVERTER, but specifically geared towards
 * numeric types. It will handle string input correctly, and provides more
 * detailed error reporting if an invalid value is passed in.
 */
#define ABI48_0_0RCT_NUMBER_CONVERTER(type, getter) \
  ABI48_0_0RCT_CUSTOM_CONVERTER(type, type, [ABI48_0_0RCT_DEBUG ? [self NSNumber:json] : json getter])

/**
 * When using ABI48_0_0RCT_ENUM_CONVERTER in ObjC, the compiler is OK with us returning
 * the underlying NSInteger/NSUInteger. In ObjC++, this is a type mismatch and
 * we need to explicitly cast the return value to expected enum return type.
 */
#ifdef __cplusplus
#define _ABI48_0_0RCT_CAST(type, expr) static_cast<type>(expr)
#else
#define _ABI48_0_0RCT_CAST(type, expr) expr
#endif

/**
 * This macro is used for creating converters for enum types.
 */
#define ABI48_0_0RCT_ENUM_CONVERTER(type, values, default, getter)                                   \
  +(type)type : (id)json ABI48_0_0RCT_DYNAMIC                                                        \
  {                                                                                         \
    static NSDictionary *mapping;                                                           \
    static dispatch_once_t onceToken;                                                       \
    dispatch_once(&onceToken, ^{                                                            \
      mapping = values;                                                                     \
    });                                                                                     \
    return _ABI48_0_0RCT_CAST(type, [ABI48_0_0RCTConvertEnumValue(#type, mapping, @(default), json) getter]); \
  }

/**
 * This macro is used for creating converters for enum types for
 * multiple enum values combined with | operator
 */
#define ABI48_0_0RCT_MULTI_ENUM_CONVERTER(type, values, default, getter)                                  \
  +(type)type : (id)json ABI48_0_0RCT_DYNAMIC                                                             \
  {                                                                                              \
    static NSDictionary *mapping;                                                                \
    static dispatch_once_t onceToken;                                                            \
    dispatch_once(&onceToken, ^{                                                                 \
      mapping = values;                                                                          \
    });                                                                                          \
    return _ABI48_0_0RCT_CAST(type, [ABI48_0_0RCTConvertMultiEnumValue(#type, mapping, @(default), json) getter]); \
  }

/**
 * This macro is used for creating explicitly-named converter functions
 * for typed arrays.
 */
#define ABI48_0_0RCT_ARRAY_CONVERTER_NAMED(type, name)            \
  +(NSArray<type *> *)name##Array : (id)json ABI48_0_0RCT_DYNAMIC \
  {                                                      \
    return ABI48_0_0RCTConvertArrayValue(@selector(name:), json); \
  }

/**
 * This macro is used for creating converter functions for typed arrays.
 * ABI48_0_0RCT_ARRAY_CONVERTER_NAMED may be used when type contains characters
 * which are disallowed in selector names.
 */
#define ABI48_0_0RCT_ARRAY_CONVERTER(type) ABI48_0_0RCT_ARRAY_CONVERTER_NAMED(type, type)
