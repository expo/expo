// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI6_0_0EXFontLoader.h"

@import CoreGraphics;
@import CoreText;
@import Foundation;
@import UIKit;

#import <objc/runtime.h>

#import "ABI6_0_0RCTConvert.h"
#import "ABI6_0_0RCTUtils.h"

static NSMutableDictionary *ABI6_0_0EXFonts = nil;

@interface ABI6_0_0EXFont : NSObject

@property (nonatomic, assign) CGFontRef cgFont;
@property (nonatomic, strong) NSMutableDictionary *sizes;

@end

@implementation ABI6_0_0EXFont

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


@implementation ABI6_0_0RCTConvert (ABI6_0_0EXFontLoader)

// Will swap this with UIFont:withFamily:size:weight:style:scaleMultiplier:

+ (UIFont *)ABI6_0_0EXFont:(UIFont *)font withFamily:(id)family
                    size:(id)size weight:(id)weight style:(id)style
         scaleMultiplier:(CGFloat)scaleMultiplier
{
  if ([family hasPrefix:@"ExponentFont-"] && ABI6_0_0EXFonts) {
    NSString *suffix = [family substringFromIndex:[@"ExponentFont-" length]];
    if (ABI6_0_0EXFonts[suffix]) {
      return [ABI6_0_0EXFonts[suffix] UIFontWithSize:[self CGFloat:size] ?: 14];
    }
  }
  return [self ABI6_0_0EXFont:font withFamily:family size:size weight:weight style:style scaleMultiplier:scaleMultiplier];
}

@end


@implementation ABI6_0_0EXFontLoader

ABI6_0_0RCT_EXPORT_MODULE(ExponentFontLoader);

+ (void)initialize {
  SEL a = @selector(ABI6_0_0EXFont:withFamily:size:weight:style:scaleMultiplier:);
  SEL b = @selector(UIFont:withFamily:size:weight:style:scaleMultiplier:);
  method_exchangeImplementations(class_getClassMethod([ABI6_0_0RCTConvert class], a),
                                 class_getClassMethod([ABI6_0_0RCTConvert class], b));
}

ABI6_0_0RCT_REMAP_METHOD(loadAsync,
                 loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                 withURL:(NSURL *)url
                 resolver:(ABI6_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI6_0_0RCTPromiseRejectBlock)reject)
{
  if (ABI6_0_0EXFonts && ABI6_0_0EXFonts[fontFamilyName]) {
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

    if (!ABI6_0_0EXFonts) {
      ABI6_0_0EXFonts = [NSMutableDictionary dictionary];
    }
    ABI6_0_0EXFonts[fontFamilyName] = [[ABI6_0_0EXFont alloc] initWithCGFont:font];
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
