// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXFont/ABI30_0_0EXFont.h>
#import <objc/runtime.h>
#import <CoreText/CoreText.h>
#import <ABI30_0_0EXFont/ABI30_0_0UIFont+EXFontLoader.h>

@interface ABI30_0_0EXFont ()

@property (nonatomic, assign) CGFontRef cgFont;
@property (nonatomic, strong) NSMutableDictionary *sizes;

@end

@implementation ABI30_0_0EXFont

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
  objc_setAssociatedObject(uiFont, ABI30_0_0EXFontAssocKey, self, OBJC_ASSOCIATION_ASSIGN);
  return uiFont;
}

- (void)dealloc
{
  CGFontRelease(_cgFont);
}

@end
