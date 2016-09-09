/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTUtils.h"

#import <mach/mach_time.h>
#import <objc/message.h>

#import <UIKit/UIKit.h>

#import <CommonCrypto/CommonCrypto.h>

#import <zlib.h>
#import <dlfcn.h>

#import "ABI10_0_0RCTAssert.h"
#import "ABI10_0_0RCTLog.h"

NSString *const ABI10_0_0RCTErrorUnspecified = @"EUNSPECIFIED";

static NSString *__nullable _ABI10_0_0RCTJSONStringifyNoRetry(id __nullable jsonObject, NSError **error)
{
  if (!jsonObject) {
    return nil;
  }

  static SEL JSONKitSelector = NULL;
  static NSSet<Class> *collectionTypes;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    SEL selector = NSSelectorFromString(@"JSONStringWithOptions:error:");
    if ([NSDictionary instancesRespondToSelector:selector]) {
      JSONKitSelector = selector;
      collectionTypes = [NSSet setWithObjects:
                         [NSArray class], [NSMutableArray class],
                         [NSDictionary class], [NSMutableDictionary class], nil];
    }
  });

  @try {

    // Use JSONKit if available and object is not a fragment
    if (JSONKitSelector && [collectionTypes containsObject:[jsonObject classForCoder]]) {
      return ((NSString *(*)(id, SEL, int, NSError **))objc_msgSend)(jsonObject, JSONKitSelector, 0, error);
    }

    // Use Foundation JSON method
    NSData *jsonData = [NSJSONSerialization
                        dataWithJSONObject:jsonObject options:(NSJSONWritingOptions)NSJSONReadingAllowFragments
                        error:error];

    return jsonData ? [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding] : nil;
  }
  @catch (NSException *exception) {

    // Convert exception to error
    if (error) {
      *error = [NSError errorWithDomain:ABI10_0_0RCTErrorDomain code:0 userInfo:@{
        NSLocalizedDescriptionKey: exception.description ?: @""
      }];
    }
    return nil;
  }
}

NSString *__nullable ABI10_0_0RCTJSONStringify(id __nullable jsonObject, NSError **error)
{
  if (error) {
    return _ABI10_0_0RCTJSONStringifyNoRetry(jsonObject, error);
  } else {
    NSError *localError;
    NSString *json = _ABI10_0_0RCTJSONStringifyNoRetry(jsonObject, &localError);
    if (localError) {
      ABI10_0_0RCTLogError(@"ABI10_0_0RCTJSONStringify() encountered the following error: %@",
                  localError.localizedDescription);
      // Sanitize the data, then retry. This is slow, but it prevents uncaught
      // data issues from crashing in production
      return _ABI10_0_0RCTJSONStringifyNoRetry(ABI10_0_0RCTJSONClean(jsonObject), NULL);
    }
    return json;
  }
}

static id __nullable _ABI10_0_0RCTJSONParse(NSString *__nullable jsonString, BOOL mutable, NSError **error)
{
  static SEL JSONKitSelector = NULL;
  static SEL JSONKitMutableSelector = NULL;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    SEL selector = NSSelectorFromString(@"objectFromJSONStringWithParseOptions:error:");
    if ([NSString instancesRespondToSelector:selector]) {
      JSONKitSelector = selector;
      JSONKitMutableSelector = NSSelectorFromString(@"mutableObjectFromJSONStringWithParseOptions:error:");
    }
  });

  if (jsonString) {

    // Use JSONKit if available and string is not a fragment
    if (JSONKitSelector) {
      NSInteger length = jsonString.length;
      for (NSInteger i = 0; i < length; i++) {
        unichar c = [jsonString characterAtIndex:i];
        if (strchr("{[", c)) {
          static const int options = (1 << 2); // loose unicode
          SEL selector = mutable ? JSONKitMutableSelector : JSONKitSelector;
          return ((id (*)(id, SEL, int, NSError **))objc_msgSend)(jsonString, selector, options, error);
        }
        if (!strchr(" \r\n\t", c)) {
          break;
        }
      }
    }

    // Use Foundation JSON method
    NSData *jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    if (!jsonData) {
      jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding allowLossyConversion:YES];
      if (jsonData) {
        ABI10_0_0RCTLogWarn(@"ABI10_0_0RCTJSONParse received the following string, which could "
                   "not be losslessly converted to UTF8 data: '%@'", jsonString);
      } else {
        NSString *errorMessage = @"ABI10_0_0RCTJSONParse received invalid UTF8 data";
        if (error) {
          *error = ABI10_0_0RCTErrorWithMessage(errorMessage);
        } else {
          ABI10_0_0RCTLogError(@"%@", errorMessage);
        }
        return nil;
      }
    }
    NSJSONReadingOptions options = NSJSONReadingAllowFragments;
    if (mutable) {
      options |= NSJSONReadingMutableContainers;
    }
    return [NSJSONSerialization JSONObjectWithData:jsonData
                                           options:options
                                             error:error];
  }
  return nil;
}

id __nullable ABI10_0_0RCTJSONParse(NSString *__nullable jsonString, NSError **error)
{
  return _ABI10_0_0RCTJSONParse(jsonString, NO, error);
}

id __nullable ABI10_0_0RCTJSONParseMutable(NSString *__nullable jsonString, NSError **error)
{
  return _ABI10_0_0RCTJSONParse(jsonString, YES, error);
}

id ABI10_0_0RCTJSONClean(id object)
{
  static dispatch_once_t onceToken;
  static NSSet<Class> *validLeafTypes;
  dispatch_once(&onceToken, ^{
    validLeafTypes = [[NSSet alloc] initWithArray:@[
      [NSString class],
      [NSMutableString class],
      [NSNumber class],
      [NSNull class],
    ]];
  });

  if ([validLeafTypes containsObject:[object classForCoder]]) {
    if ([object isKindOfClass:[NSNumber class]]) {
      return @(ABI10_0_0RCTZeroIfNaN([object doubleValue]));
    }
    if ([object isKindOfClass:[NSString class]]) {
      if ([object UTF8String] == NULL) {
        return (id)kCFNull;
      }
    }
    return object;
  }

  if ([object isKindOfClass:[NSDictionary class]]) {
    __block BOOL copy = NO;
    NSMutableDictionary<NSString *, id> *values = [[NSMutableDictionary alloc] initWithCapacity:[object count]];
    [object enumerateKeysAndObjectsUsingBlock:^(NSString *key, id item, __unused BOOL *stop) {
      id value = ABI10_0_0RCTJSONClean(item);
      values[key] = value;
      copy |= value != item;
    }];
    return copy ? values : object;
  }

  if ([object isKindOfClass:[NSArray class]]) {
    __block BOOL copy = NO;
    __block NSArray *values = object;
    [object enumerateObjectsUsingBlock:^(id item, NSUInteger idx, __unused BOOL *stop) {
      id value = ABI10_0_0RCTJSONClean(item);
      if (copy) {
        [(NSMutableArray *)values addObject:value];
      } else if (value != item) {
        // Converted value is different, so we'll need to copy the array
        values = [[NSMutableArray alloc] initWithCapacity:values.count];
        for (NSUInteger i = 0; i < idx; i++) {
          [(NSMutableArray *)values addObject:object[i]];
        }
        [(NSMutableArray *)values addObject:value];
        copy = YES;
      }
    }];
    return values;
  }

  return (id)kCFNull;
}

NSString *ABI10_0_0RCTMD5Hash(NSString *string)
{
  const char *str = string.UTF8String;
  unsigned char result[CC_MD5_DIGEST_LENGTH];
  CC_MD5(str, (CC_LONG)strlen(str), result);

  return [NSString stringWithFormat:@"%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x",
    result[0], result[1], result[2], result[3],
    result[4], result[5], result[6], result[7],
    result[8], result[9], result[10], result[11],
    result[12], result[13], result[14], result[15]
  ];
}

BOOL ABI10_0_0RCTIsMainQueue()
{
  static void *mainQueueKey = &mainQueueKey;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dispatch_queue_set_specific(dispatch_get_main_queue(),
                                mainQueueKey, mainQueueKey, NULL);
  });
  return dispatch_get_specific(mainQueueKey) == mainQueueKey;
}

void ABI10_0_0RCTExecuteOnMainQueue(dispatch_block_t block)
{
  if (ABI10_0_0RCTIsMainQueue()) {
    block();
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      block();
    });
  }
}

void ABI10_0_0RCTExecuteOnMainThread(dispatch_block_t block, BOOL sync)
{
  if (ABI10_0_0RCTIsMainQueue()) {
    block();
  } else if (sync) {
    dispatch_sync(dispatch_get_main_queue(), ^{
      block();
    });
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      block();
    });
  }
}

CGFloat ABI10_0_0RCTScreenScale()
{
  static CGFloat scale;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI10_0_0RCTExecuteOnMainThread(^{
      scale = [UIScreen mainScreen].scale;
    }, YES);
  });

  return scale;
}

CGSize ABI10_0_0RCTScreenSize()
{
  // FIXME: this caches the bounds at app start, whatever those were, and then
  // doesn't update when the device is rotated. We need to find another thread-
  // safe way to get the screen size.

  static CGSize size;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI10_0_0RCTExecuteOnMainThread(^{
      size = [UIScreen mainScreen].bounds.size;
    }, YES);
  });

  return size;
}

CGFloat ABI10_0_0RCTRoundPixelValue(CGFloat value)
{
  CGFloat scale = ABI10_0_0RCTScreenScale();
  return round(value * scale) / scale;
}

CGFloat ABI10_0_0RCTCeilPixelValue(CGFloat value)
{
  CGFloat scale = ABI10_0_0RCTScreenScale();
  return ceil(value * scale) / scale;
}

CGFloat ABI10_0_0RCTFloorPixelValue(CGFloat value)
{
  CGFloat scale = ABI10_0_0RCTScreenScale();
  return floor(value * scale) / scale;
}

CGSize ABI10_0_0RCTSizeInPixels(CGSize pointSize, CGFloat scale)
{
  return (CGSize){
    ceil(pointSize.width * scale),
    ceil(pointSize.height * scale),
  };
}

void ABI10_0_0RCTSwapClassMethods(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getClassMethod(cls, original);
  IMP originalImplementation = method_getImplementation(originalMethod);
  const char *originalArgTypes = method_getTypeEncoding(originalMethod);

  Method replacementMethod = class_getClassMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);

  if (class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    class_replaceMethod(cls, replacement, originalImplementation, originalArgTypes);
  } else {
    method_exchangeImplementations(originalMethod, replacementMethod);
  }
}

void ABI10_0_0RCTSwapInstanceMethods(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getInstanceMethod(cls, original);
  IMP originalImplementation = method_getImplementation(originalMethod);
  const char *originalArgTypes = method_getTypeEncoding(originalMethod);

  Method replacementMethod = class_getInstanceMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);

  if (class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    class_replaceMethod(cls, replacement, originalImplementation, originalArgTypes);
  } else {
    method_exchangeImplementations(originalMethod, replacementMethod);
  }
}

BOOL ABI10_0_0RCTClassOverridesClassMethod(Class cls, SEL selector)
{
  return ABI10_0_0RCTClassOverridesInstanceMethod(object_getClass(cls), selector);
}

BOOL ABI10_0_0RCTClassOverridesInstanceMethod(Class cls, SEL selector)
{
  unsigned int numberOfMethods;
  Method *methods = class_copyMethodList(cls, &numberOfMethods);
  for (unsigned int i = 0; i < numberOfMethods; i++) {
    if (method_getName(methods[i]) == selector) {
      free(methods);
      return YES;
    }
  }
  free(methods);
  return NO;
}

NSDictionary<NSString *, id> *ABI10_0_0RCTMakeError(NSString *message,
                                           id __nullable toStringify,
                                           NSDictionary<NSString *, id> *__nullable extraData)
{
  if (toStringify) {
    message = [message stringByAppendingString:[toStringify description]];
  }

  NSMutableDictionary<NSString *, id> *error = [extraData mutableCopy] ?: [NSMutableDictionary new];
  error[@"message"] = message;
  return error;
}

NSDictionary<NSString *, id> *ABI10_0_0RCTMakeAndLogError(NSString *message,
                                                 id __nullable toStringify,
                                                 NSDictionary<NSString *, id> *__nullable extraData)
{
  NSDictionary<NSString *, id> *error = ABI10_0_0RCTMakeError(message, toStringify, extraData);
  ABI10_0_0RCTLogError(@"\nError: %@", error);
  return error;
}

NSDictionary<NSString *, id> *ABI10_0_0RCTJSErrorFromNSError(NSError *error)
{
  NSString *codeWithDomain = [NSString stringWithFormat:@"E%@%zd", error.domain.uppercaseString, error.code];
  return ABI10_0_0RCTJSErrorFromCodeMessageAndNSError(codeWithDomain,
                                             error.localizedDescription,
                                             error);
}

// TODO: Can we just replace ABI10_0_0RCTMakeError with this function instead?
NSDictionary<NSString *, id> *ABI10_0_0RCTJSErrorFromCodeMessageAndNSError(NSString *code,
                                                                  NSString *message,
                                                                  NSError *__nullable error)
{
  NSString *errorMessage;
  NSArray<NSString *> *stackTrace = [NSThread callStackSymbols];
  NSMutableDictionary<NSString *, id> *errorInfo =
  [NSMutableDictionary dictionaryWithObject:stackTrace forKey:@"nativeStackIOS"];

  if (error) {
    errorMessage = error.localizedDescription ?: @"Unknown error from a native module";
    errorInfo[@"domain"] = error.domain ?: ABI10_0_0RCTErrorDomain;
  } else {
    errorMessage = @"Unknown error from a native module";
    errorInfo[@"domain"] = ABI10_0_0RCTErrorDomain;
  }
  errorInfo[@"code"] = code ?: ABI10_0_0RCTErrorUnspecified;
  // Allow for explicit overriding of the error message
  errorMessage = message ?: errorMessage;

  return ABI10_0_0RCTMakeError(errorMessage, nil, errorInfo);
}

BOOL ABI10_0_0RCTRunningInTestEnvironment(void)
{
  static BOOL isTestEnvironment = NO;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    isTestEnvironment = NSClassFromString(@"SenTestCase") || NSClassFromString(@"XCTest");
  });
  return isTestEnvironment;
}

BOOL ABI10_0_0RCTRunningInAppExtension(void)
{
  return [[[[NSBundle mainBundle] bundlePath] pathExtension] isEqualToString:@"appex"];
}

UIApplication *__nullable ABI10_0_0RCTSharedApplication(void)
{
  if (ABI10_0_0RCTRunningInAppExtension()) {
    return nil;
  }
  return [[UIApplication class] performSelector:@selector(sharedApplication)];
}

UIWindow *__nullable ABI10_0_0RCTKeyWindow(void)
{
  if (ABI10_0_0RCTRunningInAppExtension()) {
    return nil;
  }

  // TODO: replace with a more robust solution
  return ABI10_0_0RCTSharedApplication().keyWindow;
}

UIViewController *__nullable ABI10_0_0RCTPresentedViewController(void)
{
  if (ABI10_0_0RCTRunningInAppExtension()) {
    return nil;
  }

  UIViewController *controller = ABI10_0_0RCTKeyWindow().rootViewController;

  while (controller.presentedViewController) {
    controller = controller.presentedViewController;
  }

  return controller;
}

BOOL ABI10_0_0RCTForceTouchAvailable(void)
{
  static BOOL forceSupported;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    forceSupported = [UITraitCollection class] &&
    [UITraitCollection instancesRespondToSelector:@selector(forceTouchCapability)];
  });

  return forceSupported &&
    (ABI10_0_0RCTKeyWindow() ?: [UIView new]).traitCollection.forceTouchCapability == UIForceTouchCapabilityAvailable;
}

UIAlertView *__nullable ABI10_0_0RCTAlertView(NSString *title,
                                     NSString *__nullable message,
                                     id __nullable delegate,
                                     NSString *__nullable cancelButtonTitle,
                                     NSArray<NSString *> *__nullable otherButtonTitles)
{
  if (ABI10_0_0RCTRunningInAppExtension()) {
    ABI10_0_0RCTLogError(@"ABI10_0_0RCTAlertView is unavailable when running in an app extension");
    return nil;
  }

  UIAlertView *alertView = [UIAlertView new];
  alertView.title = title;
  alertView.message = message;
  alertView.delegate = delegate;
  if (cancelButtonTitle != nil) {
    [alertView addButtonWithTitle:cancelButtonTitle];
    alertView.cancelButtonIndex = 0;
  }
  for (NSString *buttonTitle in otherButtonTitles) {
    [alertView addButtonWithTitle:buttonTitle];
  }
  return alertView;
}

NSError *ABI10_0_0RCTErrorWithMessage(NSString *message)
{
  NSDictionary<NSString *, id> *errorInfo = @{NSLocalizedDescriptionKey: message};
  return [[NSError alloc] initWithDomain:ABI10_0_0RCTErrorDomain code:0 userInfo:errorInfo];
}

double ABI10_0_0RCTZeroIfNaN(double value)
{
  return isnan(value) || isinf(value) ? 0 : value;
}

NSURL *ABI10_0_0RCTDataURL(NSString *mimeType, NSData *data)
{
  return [NSURL URLWithString:
          [NSString stringWithFormat:@"data:%@;base64,%@", mimeType,
           [data base64EncodedStringWithOptions:(NSDataBase64EncodingOptions)0]]];
}

BOOL ABI10_0_0RCTIsGzippedData(NSData *__nullable); // exposed for unit testing purposes
BOOL ABI10_0_0RCTIsGzippedData(NSData *__nullable data)
{
  UInt8 *bytes = (UInt8 *)data.bytes;
  return (data.length >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b);
}

NSData *__nullable ABI10_0_0RCTGzipData(NSData *__nullable input, float level)
{
  if (input.length == 0 || ABI10_0_0RCTIsGzippedData(input)) {
    return input;
  }

  void *libz = dlopen("/usr/lib/libz.dylib", RTLD_LAZY);
  int (*deflateInit2_)(z_streamp, int, int, int, int, int, const char *, int) = dlsym(libz, "deflateInit2_");
  int (*deflate)(z_streamp, int) = dlsym(libz, "deflate");
  int (*deflateEnd)(z_streamp) = dlsym(libz, "deflateEnd");

  z_stream stream;
  stream.zalloc = Z_NULL;
  stream.zfree = Z_NULL;
  stream.opaque = Z_NULL;
  stream.avail_in = (uint)input.length;
  stream.next_in = (Bytef *)input.bytes;
  stream.total_out = 0;
  stream.avail_out = 0;

  static const NSUInteger ABI10_0_0RCTGZipChunkSize = 16384;

  NSMutableData *output = nil;
  int compression = (level < 0.0f)? Z_DEFAULT_COMPRESSION: (int)(roundf(level * 9));
  if (deflateInit2(&stream, compression, Z_DEFLATED, 31, 8, Z_DEFAULT_STRATEGY) == Z_OK) {
    output = [NSMutableData dataWithLength:ABI10_0_0RCTGZipChunkSize];
    while (stream.avail_out == 0) {
      if (stream.total_out >= output.length) {
        output.length += ABI10_0_0RCTGZipChunkSize;
      }
      stream.next_out = (uint8_t *)output.mutableBytes + stream.total_out;
      stream.avail_out = (uInt)(output.length - stream.total_out);
      deflate(&stream, Z_FINISH);
    }
    deflateEnd(&stream);
    output.length = stream.total_out;
  }

  dlclose(libz);

  return output;
}

NSString *__nullable  ABI10_0_0RCTBundlePathForURL(NSURL *__nullable URL)
{
  if (!URL.fileURL) {
    // Not a file path
    return nil;
  }
  NSString *path = URL.path;
  NSString *bundlePath = [[NSBundle mainBundle] resourcePath];
  if (![path hasPrefix:bundlePath]) {
    // Not a bundle-relative file
    return nil;
  }
  path = [path substringFromIndex:bundlePath.length];
  if ([path hasPrefix:@"/"]) {
    path = [path substringFromIndex:1];
  }
  return path;
}

BOOL ABI10_0_0RCTIsLocalAssetURL(NSURL *__nullable imageURL)
{
  NSString *name = ABI10_0_0RCTBundlePathForURL(imageURL);
  if (!name) {
    return NO;
  }

  NSString *extension = [name pathExtension];
  return [extension isEqualToString:@"png"] || [extension isEqualToString:@"jpg"];
}

ABI10_0_0RCT_EXTERN NSString *__nullable ABI10_0_0RCTTempFilePath(NSString *extension, NSError **error)
{
  static NSError *setupError = nil;
  static NSString *directory;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    directory = [NSTemporaryDirectory() stringByAppendingPathComponent:@"ReactABI10_0_0Native"];
    // If the temporary directory already exists, we'll delete it to ensure
    // that temp files from the previous run have all been deleted. This is not
    // a security measure, it simply prevents the temp directory from using too
    // much space, as the circumstances under which iOS clears it automatically
    // are not well-defined.
    NSFileManager *fileManager = [NSFileManager new];
    if ([fileManager fileExistsAtPath:directory]) {
      [fileManager removeItemAtPath:directory error:NULL];
    }
    if (![fileManager fileExistsAtPath:directory]) {
      NSError *localError = nil;
      if (![fileManager createDirectoryAtPath:directory
                  withIntermediateDirectories:YES
                                   attributes:nil
                                        error:&localError]) {
        // This is bad
        ABI10_0_0RCTLogError(@"Failed to create temporary directory: %@", localError);
        setupError = localError;
        directory = nil;
      }
    }
  });

  if (!directory || setupError) {
    if (error) {
      *error = setupError;
    }
    return nil;
  }

  // Append a unique filename
  NSString *filename = [NSUUID new].UUIDString;
  if (extension) {
    filename = [filename stringByAppendingPathExtension:extension];
  }
  return [directory stringByAppendingPathComponent:filename];
}

static void ABI10_0_0RCTGetRGBAColorComponents(CGColorRef color, CGFloat rgba[4])
{
  CGColorSpaceModel model = CGColorSpaceGetModel(CGColorGetColorSpace(color));
  const CGFloat *components = CGColorGetComponents(color);
  switch (model)
  {
    case kCGColorSpaceModelMonochrome:
    {
      rgba[0] = components[0];
      rgba[1] = components[0];
      rgba[2] = components[0];
      rgba[3] = components[1];
      break;
    }
    case kCGColorSpaceModelRGB:
    {
      rgba[0] = components[0];
      rgba[1] = components[1];
      rgba[2] = components[2];
      rgba[3] = components[3];
      break;
    }
    case kCGColorSpaceModelCMYK:
    case kCGColorSpaceModelDeviceN:
    case kCGColorSpaceModelIndexed:
    case kCGColorSpaceModelLab:
    case kCGColorSpaceModelPattern:
    case kCGColorSpaceModelUnknown:
    {

#ifdef ABI10_0_0RCT_DEBUG
      //unsupported format
      ABI10_0_0RCTLogError(@"Unsupported color model: %i", model);
#endif

      rgba[0] = 0.0;
      rgba[1] = 0.0;
      rgba[2] = 0.0;
      rgba[3] = 1.0;
      break;
    }
  }
}

NSString *ABI10_0_0RCTColorToHexString(CGColorRef color)
{
  CGFloat rgba[4];
  ABI10_0_0RCTGetRGBAColorComponents(color, rgba);
  uint8_t r = rgba[0]*255;
  uint8_t g = rgba[1]*255;
  uint8_t b = rgba[2]*255;
  uint8_t a = rgba[3]*255;
  if (a < 255) {
    return [NSString stringWithFormat:@"#%02x%02x%02x%02x", r, g, b, a];
  } else {
    return [NSString stringWithFormat:@"#%02x%02x%02x", r, g, b];
  }
}

// (https://github.com/0xced/XCDFormInputAccessoryView/blob/master/XCDFormInputAccessoryView/XCDFormInputAccessoryView.m#L10-L14)
NSString *ABI10_0_0RCTUIKitLocalizedString(NSString *string)
{
  NSBundle *UIKitBundle = [NSBundle bundleForClass:[UIApplication class]];
  return UIKitBundle ? [UIKitBundle localizedStringForKey:string value:string table:nil] : string;
}

NSString *__nullable ABI10_0_0RCTGetURLQueryParam(NSURL *__nullable URL, NSString *param)
{
  ABI10_0_0RCTAssertParam(param);
  if (!URL) {
    return nil;
  }
  NSURLComponents *components = [NSURLComponents componentsWithURL:URL
                                           resolvingAgainstBaseURL:YES];

  // TODO: use NSURLComponents.queryItems once we drop support for iOS 7
  for (NSString *item in [components.percentEncodedQuery componentsSeparatedByString:@"&"].reverseObjectEnumerator) {
    NSArray *keyValue = [item componentsSeparatedByString:@"="];
    NSString *key = [keyValue.firstObject stringByRemovingPercentEncoding];
    if ([key isEqualToString:param]) {
      return [keyValue.lastObject stringByRemovingPercentEncoding];
    }
  }
  return nil;
}

NSURL *__nullable ABI10_0_0RCTURLByReplacingQueryParam(NSURL *__nullable URL, NSString *param, NSString *__nullable value)
{
  ABI10_0_0RCTAssertParam(param);
  if (!URL) {
    return nil;
  }
  NSURLComponents *components = [NSURLComponents componentsWithURL:URL
                                           resolvingAgainstBaseURL:YES];

  // TODO: use NSURLComponents.queryItems once we drop support for iOS 7

  // Unhelpfully, iOS doesn't provide this set as a constant
  static NSCharacterSet *URLParamCharacterSet;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSMutableCharacterSet *characterSet = [NSMutableCharacterSet new];
    [characterSet formUnionWithCharacterSet:[NSCharacterSet URLQueryAllowedCharacterSet]];
    [characterSet removeCharactersInString:@"&=?"];
    URLParamCharacterSet = [characterSet copy];
  });

  NSString *encodedParam =
  [param stringByAddingPercentEncodingWithAllowedCharacters:URLParamCharacterSet];

  __block NSInteger paramIndex = NSNotFound;
  NSMutableArray *queryItems = [[components.percentEncodedQuery componentsSeparatedByString:@"&"] mutableCopy];
  [queryItems enumerateObjectsWithOptions:NSEnumerationReverse usingBlock:
   ^(NSString *item, NSUInteger i, BOOL *stop) {
     NSArray *keyValue = [item componentsSeparatedByString:@"="];
     if ([keyValue.firstObject isEqualToString:encodedParam]) {
       paramIndex = i;
       *stop = YES;
     }
   }];

  if (!value) {
    if (paramIndex != NSNotFound) {
      [queryItems removeObjectAtIndex:paramIndex];
    }
  } else {
    NSString *encodedValue =
    [value stringByAddingPercentEncodingWithAllowedCharacters:URLParamCharacterSet];

    NSString *newItem = [encodedParam stringByAppendingFormat:@"=%@", encodedValue];
    if (paramIndex == NSNotFound) {
      [queryItems addObject:newItem];
    } else {
      [queryItems replaceObjectAtIndex:paramIndex withObject:newItem];
    }
  }
  components.percentEncodedQuery = [queryItems componentsJoinedByString:@"&"];
  return components.URL;
}
