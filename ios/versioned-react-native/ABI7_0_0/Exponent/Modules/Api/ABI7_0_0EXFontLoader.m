// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI7_0_0EXFontLoader.h"

@import CoreGraphics;
@import CoreText;
@import Foundation;
@import UIKit;

#import <objc/runtime.h>

#import "ABI7_0_0RCTConvert.h"
#import "ABI7_0_0RCTUtils.h"

static NSMutableDictionary *ABI7_0_0EXFonts = nil;

@interface ABI7_0_0EXFont : NSObject

@property (nonatomic, assign) CGFontRef cgFont;
@property (nonatomic, strong) NSMutableDictionary *sizes;

@end

@implementation ABI7_0_0EXFont

- (instancetype) initWithCGFont:(CGFontRef )cgFont
{
  if ((self = [super init])) {
    _cgFont = cgFont;
    _sizes = [NSMutableDictionary dictionary];
  }
  return self;
}

- (UIFont *) UIFontWithSize:(CGFloat) fsize
{
  NSNumber *size = @(fsize);
  UIFont *uiFont = _sizes[size];
  if (uiFont) {
    return uiFont;
  }
  uiFont = (__bridge_transfer UIFont *)CTFontCreateWithGraphicsFont(_cgFont, fsize, NULL, NULL);
  _sizes[size] = uiFont;
  return uiFont;
}

- (void) dealloc
{
  CGFontRelease(_cgFont);
}

@end


@implementation ABI7_0_0RCTConvert (ABI7_0_0EXFontLoader)

// Will swap this with UIFont:withFamily:size:weight:style:scaleMultiplier:

+ (UIFont *)ABI7_0_0EXFont:(UIFont *)font withFamily:(id)family
                    size:(id)size weight:(id)weight style:(id)style
         scaleMultiplier:(CGFloat)scaleMultiplier
{
  if ([family hasPrefix:@"ExponentFont-"] && ABI7_0_0EXFonts) {
    NSString *suffix = [family substringFromIndex:[@"ExponentFont-" length]];
    if (ABI7_0_0EXFonts[suffix]) {
      return [ABI7_0_0EXFonts[suffix] UIFontWithSize:[self CGFloat:size] ?: 14];
    }
  }
  return [self ABI7_0_0EXFont:font withFamily:family size:size weight:weight style:style scaleMultiplier:scaleMultiplier];
}

@end


@implementation ABI7_0_0EXFontLoader

ABI7_0_0RCT_EXPORT_MODULE(ExponentFontLoader);

+ (void)initialize {
  SEL a = @selector(ABI7_0_0EXFont:withFamily:size:weight:style:scaleMultiplier:);
  SEL b = @selector(UIFont:withFamily:size:weight:style:scaleMultiplier:);
  method_exchangeImplementations(class_getClassMethod([ABI7_0_0RCTConvert class], a),
                                 class_getClassMethod([ABI7_0_0RCTConvert class], b));
}

ABI7_0_0RCT_REMAP_METHOD(loadAsync,
                 loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                 withURL:(NSURL *)url
                 resolver:(ABI7_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI7_0_0RCTPromiseRejectBlock)reject)
{
  if (ABI7_0_0EXFonts && ABI7_0_0EXFonts[fontFamilyName]) {
    reject(@"E_FONT_ALREADY_EXISTS",
           [NSString stringWithFormat:@"Font with family name '%@' already loaded", fontFamilyName],
           nil);
    return;
  }

  NSURLSessionConfiguration *sessionConfiguration = [NSURLSessionConfiguration defaultSessionConfiguration];
  NSURLSession *session = [NSURLSession sessionWithConfiguration:sessionConfiguration];
  NSURLSessionDataTask *task = [session dataTaskWithURL:url completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    if (error) {
      reject(@"E_FONT_DOWNLOAD_FAILED",
             [NSString stringWithFormat:@"Could not download font data for '%@'", fontFamilyName],
             error);
      return;
    }

    CGDataProviderRef provider = CGDataProviderCreateWithCFData((__bridge CFDataRef)data);
    CGFontRef font = CGFontCreateWithDataProvider(provider);
    CGDataProviderRelease(provider);
    if (!font) {
      reject(@"E_FONT_CREATION_FAILED",
             [NSString stringWithFormat:@"Could not create font from loaded data for '%@'", fontFamilyName],
             nil);
      return;
    }

    if (!ABI7_0_0EXFonts) {
      ABI7_0_0EXFonts = [NSMutableDictionary dictionary];
    }
    ABI7_0_0EXFonts[fontFamilyName] = [[ABI7_0_0EXFont alloc] initWithCGFont:font];
    resolve(nil);
  }];
  [task resume];
}

- (dispatch_queue_t)methodQueue
{
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("host.exp.Exponent.FontLoader", DISPATCH_QUEUE_SERIAL);
  });
  return queue;
}

@end
