// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI11_0_0EXFontLoader.h"

@import CoreGraphics;
@import CoreText;
@import Foundation;
@import UIKit;

#import <objc/runtime.h>

#import "ABI11_0_0RCTConvert.h"
#import "ABI11_0_0RCTFont.h"
#import "ABI11_0_0RCTUtils.h"

static NSMutableDictionary *ABI11_0_0EXFonts = nil;

@interface ABI11_0_0EXFont : NSObject

@property (nonatomic, assign) CGFontRef cgFont;
@property (nonatomic, strong) NSMutableDictionary *sizes;

@end

@implementation ABI11_0_0EXFont

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


@implementation ABI11_0_0RCTFont (ABI11_0_0EXFontLoader)

// Will swap this with +[ABI11_0_0RCTFont updateFont: ...]
+ (UIFont *)ex_updateFont:(UIFont *)font
               withFamily:(NSString *)family
                     size:(NSNumber *)size
                   weight:(NSString *)weight
                    style:(NSString *)style
                  variant:(NSArray<NSDictionary *> *)variant
          scaleMultiplier:(CGFloat)scaleMultiplier
{
  NSString * const exponentPrefix = @"ExponentFont-";
  const CGFloat defaultFontSize = 14;
  
  // TODO: Figure out a way to support the other fields in the JSON configuration
  if ([family hasPrefix:exponentPrefix] && ABI11_0_0EXFonts) {
    NSString *suffix = [family substringFromIndex:exponentPrefix.length];
    if (ABI11_0_0EXFonts[suffix]) {
      return [ABI11_0_0EXFonts[suffix] UIFontWithSize:[ABI11_0_0RCTConvert CGFloat:size] ?: defaultFontSize];
    }
  }
  
  return [self ex_updateFont:font withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
}

@end


@implementation ABI11_0_0EXFontLoader

ABI11_0_0RCT_EXPORT_MODULE(ExponentFontLoader);

+ (void)initialize {
  SEL a = @selector(ex_updateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
  SEL b = @selector(updateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
  method_exchangeImplementations(class_getClassMethod([ABI11_0_0RCTFont class], a),
                                 class_getClassMethod([ABI11_0_0RCTFont class], b));
}

ABI11_0_0RCT_REMAP_METHOD(loadAsync,
                 loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                 withLocalUri:(NSURL *)uri
                 resolver:(ABI11_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI11_0_0RCTPromiseRejectBlock)reject)
{
  if (ABI11_0_0EXFonts && ABI11_0_0EXFonts[fontFamilyName]) {
    reject(@"E_FONT_ALREADY_EXISTS",
           [NSString stringWithFormat:@"Font with family name '%@' already loaded", fontFamilyName],
           nil);
    return;
  }

  // TODO(nikki): make sure path is in experience's scope
  NSString *path = [uri path];
  NSData *data = [[NSFileManager defaultManager] contentsAtPath:path];
  if (!data) {
      reject(@"E_FONT_FILE_NOT_FOUND",
             [NSString stringWithFormat:@"File '%@' for font '%@' doesn't exist", path, fontFamilyName],
             nil);
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

  if (!ABI11_0_0EXFonts) {
    ABI11_0_0EXFonts = [NSMutableDictionary dictionary];
  }
  ABI11_0_0EXFonts[fontFamilyName] = [[ABI11_0_0EXFont alloc] initWithCGFont:font];
  resolve(nil);
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
