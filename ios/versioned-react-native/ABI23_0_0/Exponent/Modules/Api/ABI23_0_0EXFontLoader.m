// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXFontLoader.h"

@import CoreGraphics;
@import CoreText;
@import Foundation;
@import UIKit;

#import <objc/runtime.h>

#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTFont.h>
#import <ReactABI23_0_0/ABI23_0_0RCTUtils.h>

static NSMutableDictionary *ABI23_0_0EXFonts = nil;

static const char *ABI23_0_0EXFontAssocKey = "ABI23_0_0EXFont";

@interface ABI23_0_0EXFont : NSObject

@property (nonatomic, assign) CGFontRef cgFont;
@property (nonatomic, strong) NSMutableDictionary *sizes;

@end

@implementation ABI23_0_0EXFont

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
  objc_setAssociatedObject(uiFont, ABI23_0_0EXFontAssocKey, self, OBJC_ASSOCIATION_ASSIGN);
  return uiFont;
}

- (void) dealloc
{
  CGFontRelease(_cgFont);
}

@end


@implementation ABI23_0_0RCTFont (ABI23_0_0EXFontLoader)

// Will swap this with +[ABI23_0_0RCTFont updateFont: ...]
+ (UIFont *)ex_updateFont:(UIFont *)uiFont
               withFamily:(NSString *)family
                     size:(NSNumber *)size
                   weight:(NSString *)weight
                    style:(NSString *)style
                  variant:(NSArray<NSDictionary *> *)variant
          scaleMultiplier:(CGFloat)scaleMultiplier
{
  NSString *const exponentPrefix = @"ExponentFont-";
  const CGFloat defaultFontSize = 14;
  ABI23_0_0EXFont *exFont = nil;

  // Did we get a new family, and if so, is it associated with an ABI23_0_0EXFont?
  if ([family hasPrefix:exponentPrefix] && ABI23_0_0EXFonts) {
    NSString *suffix = [family substringFromIndex:exponentPrefix.length];
    exFont = ABI23_0_0EXFonts[suffix];
  }

  // Did the passed-in UIFont come from an ABI23_0_0EXFont?
  if (!exFont && uiFont) {
    exFont = objc_getAssociatedObject(uiFont, ABI23_0_0EXFontAssocKey);
  }

  // If it's an ABI23_0_0EXFont, generate the corresponding UIFont, else fallback to ReactABI23_0_0 Native's built-in method
  if (exFont) {
    return [exFont UIFontWithSize:[ABI23_0_0RCTConvert CGFloat:size] ?: uiFont.pointSize ?: defaultFontSize];
  } else {
    return [self ex_updateFont:uiFont withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
  }
}

@end


@implementation UIFont (ABI23_0_0EXFontLoader)

- (UIFont *)ex_fontWithSize:(CGFloat)fontSize
{
  ABI23_0_0EXFont *exFont = objc_getAssociatedObject(self, ABI23_0_0EXFontAssocKey);
  if (exFont) {
    return [exFont UIFontWithSize:fontSize];
  } else {
    return [self ex_fontWithSize:fontSize];
  }
}

@end


@implementation ABI23_0_0EXFontLoader

ABI23_0_0RCT_EXPORT_MODULE(ExponentFontLoader);

+ (void)initialize {
  {
    SEL a = @selector(ex_updateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
    SEL b = @selector(updateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
    method_exchangeImplementations(class_getClassMethod([ABI23_0_0RCTFont class], a),
                                   class_getClassMethod([ABI23_0_0RCTFont class], b));
  }
  {
    SEL a = @selector(ex_fontWithSize:);
    SEL b = @selector(fontWithSize:);
    method_exchangeImplementations(class_getInstanceMethod([UIFont class], a),
                                   class_getInstanceMethod([UIFont class], b));
  }
}

ABI23_0_0RCT_REMAP_METHOD(loadAsync,
                 loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                 withLocalUri:(NSURL *)uri
                 resolver:(ABI23_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI23_0_0RCTPromiseRejectBlock)reject)
{
  if (ABI23_0_0EXFonts && ABI23_0_0EXFonts[fontFamilyName]) {
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

  if (!ABI23_0_0EXFonts) {
    ABI23_0_0EXFonts = [NSMutableDictionary dictionary];
  }
  ABI23_0_0EXFonts[fontFamilyName] = [[ABI23_0_0EXFont alloc] initWithCGFont:font];
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
