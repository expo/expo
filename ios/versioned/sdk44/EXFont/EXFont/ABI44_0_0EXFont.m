// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXFont/ABI44_0_0EXFont.h>
#import <objc/runtime.h>
#import <CoreText/CoreText.h>

@interface ABI44_0_0EXFont ()

@property (nonatomic, assign) CGFontRef cgFont;
@property (nonatomic, strong) NSMutableDictionary *sizes;

@end

@implementation ABI44_0_0EXFont

- (instancetype)initWithCGFont:(CGFontRef)cgFont
{
  if (self = [super init]) {
    _cgFont = cgFont;
    _sizes = [NSMutableDictionary dictionary];
  }
  return self;
}

- (UIFont *)UIFontWithSize:(CGFloat)fsize
{
  NSNumber *size = @(fsize);
  UIFont *uiFont = _sizes[size];
  if (uiFont) {
    return uiFont;
  }
  uiFont = (__bridge_transfer UIFont *)CTFontCreateWithGraphicsFont(_cgFont, fsize, NULL, NULL);
  _sizes[size] = uiFont;
  objc_setAssociatedObject(uiFont, ABI44_0_0EXFontAssocKey, self, OBJC_ASSOCIATION_ASSIGN);
  return uiFont;
}

- (void)dealloc
{
  CGFontRelease(_cgFont);
}

@end
