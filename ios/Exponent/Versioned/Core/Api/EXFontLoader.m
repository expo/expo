// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFontLoader.h"
#import "EXUnversioned.h"

@import CoreGraphics;
@import CoreText;
@import Foundation;
@import UIKit;

#import <objc/runtime.h>

#import <React/RCTConvert.h>
#import <React/RCTFont.h>
#import <React/RCTUtils.h>

static NSMutableDictionary *EXFonts = nil;

static const char *EXFontAssocKey = "EXFont";

@interface EXFont : NSObject

@property (nonatomic, assign) CGFontRef cgFont;
@property (nonatomic, strong) NSMutableDictionary *sizes;

@end

@implementation EXFont

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
  objc_setAssociatedObject(uiFont, EXFontAssocKey, self, OBJC_ASSOCIATION_ASSIGN);
  return uiFont;
}

- (void) dealloc
{
  CGFontRelease(_cgFont);
}

@end


@implementation RCTFont (EXFontLoader)

// Will swap this with +[RCTFont updateFont: ...]
+ (UIFont *)EXUpdateFont:(UIFont *)uiFont
              withFamily:(NSString *)family
                    size:(NSNumber *)size
                  weight:(NSString *)weight
                   style:(NSString *)style
                 variant:(NSArray<NSDictionary *> *)variant
         scaleMultiplier:(CGFloat)scaleMultiplier
{
  NSString *const exponentPrefix = @"ExponentFont-";
  const CGFloat defaultFontSize = 14;
  EXFont *exFont = nil;

  // Did we get a new family, and if so, is it associated with an EXFont?
  if ([family hasPrefix:exponentPrefix] && EXFonts) {
    NSString *suffix = [family substringFromIndex:exponentPrefix.length];
    exFont = EXFonts[suffix];
  }

  // Did the passed-in UIFont come from an EXFont?
  if (!exFont && uiFont) {
    exFont = objc_getAssociatedObject(uiFont, EXFontAssocKey);
  }

  // If it's an EXFont, generate the corresponding UIFont, else fallback to React Native's built-in method
  if (exFont) {
    CGFloat computedSize = [RCTConvert CGFloat:size] ?: uiFont.pointSize ?: defaultFontSize;
    if (scaleMultiplier > 0.0 && scaleMultiplier != 1.0) {
      computedSize = round(computedSize * scaleMultiplier);
    }
    return [exFont UIFontWithSize:computedSize];
  } else {
    return [self EXUpdateFont:uiFont withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
  }
}

@end


@implementation UIFont (EXFontLoader)

- (UIFont *)EXFontWithSize:(CGFloat)fontSize
{
  EXFont *exFont = objc_getAssociatedObject(self, EXFontAssocKey);
  if (exFont) {
    return [exFont UIFontWithSize:fontSize];
  } else {
    return [self EXFontWithSize:fontSize];
  }
}

@end

@interface EXFontLoader ()
{
  BOOL _isInForeground;
}

@end

@implementation EXFontLoader

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(ExponentFontLoader);

+ (void)initialize {
  {
    SEL a = @selector(EXUpdateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
    SEL b = @selector(updateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
    method_exchangeImplementations(class_getClassMethod([RCTFont class], a),
                                   class_getClassMethod([RCTFont class], b));
  }
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  if (_bridge) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_bridgeDidForeground:)
                                                 name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_bridgeDidBackground:)
                                                 name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
                                               object:_bridge];
    [self _bridgeDidForeground:nil];
  } else {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
  }
}

- (void)dealloc
{
  [self _bridgeDidBackground:nil];
}

RCT_REMAP_METHOD(loadAsync,
                 loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                 withLocalUri:(NSURL *)uri
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (EXFonts && EXFonts[fontFamilyName]) {
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

  if (!EXFonts) {
    EXFonts = [NSMutableDictionary dictionary];
  }
  EXFonts[fontFamilyName] = [[EXFont alloc] initWithCGFont:font];
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

#pragma mark - internal

- (void)_swizzleUIFont
{
  SEL a = @selector(EXFontWithSize:);
  SEL b = @selector(fontWithSize:);
  method_exchangeImplementations(class_getInstanceMethod([UIFont class], a),
                                 class_getInstanceMethod([UIFont class], b));
}

- (void)_bridgeDidForeground:(__unused NSNotification *)notif
{
  if (!_isInForeground) {
    [self _swizzleUIFont];
    _isInForeground = YES;
  }
}

- (void)_bridgeDidBackground:(__unused NSNotification *)notif
{
  if (_isInForeground) {
    _isInForeground = NO;
    [self _swizzleUIFont];
  }
}

@end
