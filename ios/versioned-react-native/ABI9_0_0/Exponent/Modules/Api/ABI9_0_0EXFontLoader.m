// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI9_0_0EXFontLoader.h"

@import CoreGraphics;
@import CoreText;
@import Foundation;
@import UIKit;

#import <objc/runtime.h>

#import "ABI9_0_0RCTConvert.h"
#import "ABI9_0_0RCTUtils.h"

static NSMutableDictionary *ABI9_0_0EXFonts = nil;

@interface ABI9_0_0EXFont : NSObject

@property (nonatomic, assign) CGFontRef cgFont;
@property (nonatomic, strong) NSMutableDictionary *sizes;

@end

@implementation ABI9_0_0EXFont

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


@implementation ABI9_0_0RCTConvert (ABI9_0_0EXFontLoader)

// Will swap this with UIFont:withFamily:size:weight:style:scaleMultiplier:

+ (UIFont *)ABI9_0_0EXFont:(UIFont *)font withFamily:(id)family
                    size:(id)size weight:(id)weight style:(id)style
         scaleMultiplier:(CGFloat)scaleMultiplier
{
  if ([family hasPrefix:@"ExponentFont-"] && ABI9_0_0EXFonts) {
    NSString *suffix = [family substringFromIndex:[@"ExponentFont-" length]];
    if (ABI9_0_0EXFonts[suffix]) {
      return [ABI9_0_0EXFonts[suffix] UIFontWithSize:[self CGFloat:size] ?: 14];
    }
  }
  return [self ABI9_0_0EXFont:font withFamily:family size:size weight:weight style:style scaleMultiplier:scaleMultiplier];
}

@end


@implementation ABI9_0_0EXFontLoader

ABI9_0_0RCT_EXPORT_MODULE(ExponentFontLoader);

+ (void)initialize {
  SEL a = @selector(ABI9_0_0EXFont:withFamily:size:weight:style:scaleMultiplier:);
  SEL b = @selector(UIFont:withFamily:size:weight:style:scaleMultiplier:);
  method_exchangeImplementations(class_getClassMethod([ABI9_0_0RCTConvert class], a),
                                 class_getClassMethod([ABI9_0_0RCTConvert class], b));
}

ABI9_0_0RCT_REMAP_METHOD(loadAsync,
                 loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                 withLocalUri:(NSURL *)uri
                 resolver:(ABI9_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI9_0_0RCTPromiseRejectBlock)reject)
{
  if (ABI9_0_0EXFonts && ABI9_0_0EXFonts[fontFamilyName]) {
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

  if (!ABI9_0_0EXFonts) {
    ABI9_0_0EXFonts = [NSMutableDictionary dictionary];
  }
  ABI9_0_0EXFonts[fontFamilyName] = [[ABI9_0_0EXFont alloc] initWithCGFont:font];
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
