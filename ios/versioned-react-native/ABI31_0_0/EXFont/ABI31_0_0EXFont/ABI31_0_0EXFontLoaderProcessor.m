// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXFont/ABI31_0_0EXFontLoaderProcessor.h>
#import <ABI31_0_0EXFont/ABI31_0_0EXFontLoader.h>
#import <ABI31_0_0EXFont/ABI31_0_0EXFont.h>
#import <ABI31_0_0EXFont/ABI31_0_0EXFontManager.h>
#import <objc/runtime.h>

static NSString *exponentPrefix = @"ExpoFont-";

@implementation ABI31_0_0EXFontLoaderProcessor

- (UIFont *)updateFont:(UIFont *)uiFont
              withFamily:(NSString *)family
                    size:(NSNumber *)size
                  weight:(NSString *)weight
                   style:(NSString *)style
                 variant:(NSArray<NSDictionary *> *)variant
         scaleMultiplier:(CGFloat)scaleMultiplier
{
  const CGFloat defaultFontSize = 14;
  ABI31_0_0EXFont *exFont = nil;
  
  // Did we get a new family, and if so, is it associated with an ABI31_0_0EXFont?
  if ([family hasPrefix:exponentPrefix]) {
    NSString *suffix = [family substringFromIndex:exponentPrefix.length];
    exFont = [ABI31_0_0EXFontManager getFontForName:suffix];
  }
  
  // Did the passed-in UIFont come from an ABI31_0_0EXFont?
  if (!exFont && uiFont) {
    exFont = objc_getAssociatedObject(uiFont, ABI31_0_0EXFontAssocKey);
  }
  
  // If it's an ABI31_0_0EXFont, generate the corresponding UIFont, else fallback to ReactABI31_0_0 Native's built-in method
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
