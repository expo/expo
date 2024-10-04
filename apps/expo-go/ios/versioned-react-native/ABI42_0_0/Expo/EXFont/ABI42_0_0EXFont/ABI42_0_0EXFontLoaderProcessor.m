// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXFont/ABI42_0_0EXFontLoaderProcessor.h>
#import <ABI42_0_0EXFont/ABI42_0_0EXFontLoader.h>
#import <ABI42_0_0EXFont/ABI42_0_0EXFont.h>
#import <ABI42_0_0EXFont/ABI42_0_0EXFontManager.h>
#import <objc/runtime.h>

@interface ABI42_0_0EXFontLoaderProcessor ()

@property (nonatomic, copy) NSString *fontFamilyPrefix;
@property (nonatomic, strong) ABI42_0_0EXFontManager *manager;

@end

@implementation ABI42_0_0EXFontLoaderProcessor

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI42_0_0EXFontManager *)manager
{
  if (self = [super init]) {
    _fontFamilyPrefix = prefix;
    _manager = manager;
  }
  return self;
}

- (instancetype)initWithManager:(ABI42_0_0EXFontManager *)manager
{
  return [self initWithFontFamilyPrefix:nil manager:manager];
}

- (UIFont *)updateFont:(UIFont *)uiFont
              withFamily:(NSString *)family
                    size:(NSNumber *)size
                  weight:(NSString *)weight
                   style:(NSString *)style
                 variant:(NSArray<NSDictionary *> *)variant
         scaleMultiplier:(CGFloat)scaleMultiplier
{
  const CGFloat defaultFontSize = 14;
  ABI42_0_0EXFont *exFont = nil;

  // Did we get a new family, and if so, is it associated with an ABI42_0_0EXFont?
  if (_fontFamilyPrefix && [family hasPrefix:_fontFamilyPrefix]) {
    NSString *suffix = [family substringFromIndex:_fontFamilyPrefix.length];
    exFont = [_manager fontForName:suffix];
  } else if (!_fontFamilyPrefix) {
    exFont = [_manager fontForName:family];
  }

  // Did the passed-in UIFont come from an ABI42_0_0EXFont?
  if (!exFont && uiFont) {
    exFont = objc_getAssociatedObject(uiFont, ABI42_0_0EXFontAssocKey);
  }

  // If it's an ABI42_0_0EXFont, generate the corresponding UIFont, else fallback to ABI42_0_0React Native's built-in method
  if (exFont) {
    CGFloat computedSize = [size doubleValue] ?: uiFont.pointSize ?: defaultFontSize;
    if (scaleMultiplier > 0.0 && scaleMultiplier != 1.0) {
      computedSize = round(computedSize * scaleMultiplier);
    }
    return [exFont UIFontWithSize:computedSize];
  }

  return nil;
}

@end
