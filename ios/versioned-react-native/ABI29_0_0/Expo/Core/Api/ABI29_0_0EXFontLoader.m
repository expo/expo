// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI29_0_0EXFontLoader.h"
#import "ABI29_0_0EXUnversioned.h"

@import CoreGraphics;
@import CoreText;
@import Foundation;
@import UIKit;

#import <objc/runtime.h>

#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>
#import <ReactABI29_0_0/ABI29_0_0RCTFont.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUtils.h>

static NSMutableDictionary *ABI29_0_0EXFonts = nil;

static const char *ABI29_0_0EXFontAssocKey = "ABI29_0_0EXFont";

@interface ABI29_0_0EXFont : NSObject

@property (nonatomic, assign) CGFontRef cgFont;
@property (nonatomic, strong) NSMutableDictionary *sizes;

@end

@implementation ABI29_0_0EXFont

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
  objc_setAssociatedObject(uiFont, ABI29_0_0EXFontAssocKey, self, OBJC_ASSOCIATION_ASSIGN);
  return uiFont;
}

- (void) dealloc
{
  CGFontRelease(_cgFont);
}

@end


@implementation ABI29_0_0RCTFont (ABI29_0_0EXFontLoader)

// Will swap this with +[ABI29_0_0RCTFont updateFont: ...]
+ (UIFont *)ABI29_0_0EXUpdateFont:(UIFont *)uiFont
              withFamily:(NSString *)family
                    size:(NSNumber *)size
                  weight:(NSString *)weight
                   style:(NSString *)style
                 variant:(NSArray<NSDictionary *> *)variant
         scaleMultiplier:(CGFloat)scaleMultiplier
{
  NSString *const exponentPrefix = @"ExponentFont-";
  const CGFloat defaultFontSize = 14;
  ABI29_0_0EXFont *exFont = nil;

  // Did we get a new family, and if so, is it associated with an ABI29_0_0EXFont?
  if ([family hasPrefix:exponentPrefix] && ABI29_0_0EXFonts) {
    NSString *suffix = [family substringFromIndex:exponentPrefix.length];
    exFont = ABI29_0_0EXFonts[suffix];
  }

  // Did the passed-in UIFont come from an ABI29_0_0EXFont?
  if (!exFont && uiFont) {
    exFont = objc_getAssociatedObject(uiFont, ABI29_0_0EXFontAssocKey);
  }

  // If it's an ABI29_0_0EXFont, generate the corresponding UIFont, else fallback to ReactABI29_0_0 Native's built-in method
  if (exFont) {
    CGFloat computedSize = [ABI29_0_0RCTConvert CGFloat:size] ?: uiFont.pointSize ?: defaultFontSize;
    if (scaleMultiplier > 0.0 && scaleMultiplier != 1.0) {
      computedSize = round(computedSize * scaleMultiplier);
    }
    return [exFont UIFontWithSize:computedSize];
  } else {
    return [self ABI29_0_0EXUpdateFont:uiFont withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
  }
}

@end


@implementation UIFont (ABI29_0_0EXFontLoader)

- (UIFont *)ABI29_0_0EXFontWithSize:(CGFloat)fontSize
{
  ABI29_0_0EXFont *exFont = objc_getAssociatedObject(self, ABI29_0_0EXFontAssocKey);
  if (exFont) {
    return [exFont UIFontWithSize:fontSize];
  } else {
    return [self ABI29_0_0EXFontWithSize:fontSize];
  }
}

@end

@interface ABI29_0_0EXFontLoader ()
{
  BOOL _isInForeground;
}

@end

@implementation ABI29_0_0EXFontLoader

@synthesize bridge = _bridge;

ABI29_0_0RCT_EXPORT_MODULE(ExponentFontLoader);

+ (void)initialize {
  {
    SEL a = @selector(ABI29_0_0EXUpdateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
    SEL b = @selector(updateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
    method_exchangeImplementations(class_getClassMethod([ABI29_0_0RCTFont class], a),
                                   class_getClassMethod([ABI29_0_0RCTFont class], b));
  }
}

- (void)setBridge:(ABI29_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  if (_bridge) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_bridgeDidForeground:)
                                                 name:@"EXKernelBridgeDidForegroundNotification"
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_bridgeDidBackground:)
                                                 name:@"EXKernelBridgeDidBackgroundNotification"
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

ABI29_0_0RCT_REMAP_METHOD(loadAsync,
                 loadAsyncWithFontFamilyName:(NSString *)fontFamilyName
                 withLocalUri:(NSURL *)uri
                 resolver:(ABI29_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI29_0_0RCTPromiseRejectBlock)reject)
{
  if (ABI29_0_0EXFonts && ABI29_0_0EXFonts[fontFamilyName]) {
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

  if (!ABI29_0_0EXFonts) {
    ABI29_0_0EXFonts = [NSMutableDictionary dictionary];
  }
  ABI29_0_0EXFonts[fontFamilyName] = [[ABI29_0_0EXFont alloc] initWithCGFont:font];
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
  SEL a = @selector(ABI29_0_0EXFontWithSize:);
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
