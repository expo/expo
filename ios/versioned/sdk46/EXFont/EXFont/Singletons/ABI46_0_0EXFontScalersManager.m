// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXFont/ABI46_0_0EXFontScalersManager.h>

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXDefines.h>
#import <ABI46_0_0EXFont/ABI46_0_0EXFont.h>

#import <objc/runtime.h>

static NSPointerArray *currentFontScalers;

@implementation UIFont (ABI46_0_0EXFontLoader)

- (UIFont *)ABI46_0_0EXFontWithSize:(CGFloat)fontSize
{
  for (id<ABI46_0_0EXFontScalerInterface> fontScaler in currentFontScalers) {
    UIFont *scaledFont = [fontScaler scaledFont:self toSize:fontSize];
    if (scaledFont) {
      return scaledFont;
    }
  }

  return [self ABI46_0_0EXFontWithSize:fontSize];
}

@end

/**
 * A singleton module responsible for overriding UIFont's
 * fontWithSize: method which is used for scaling fonts.
 * We need this one, central place to store the scalers
 * as for now to get rid of timing problems when backgrounding/
 * foregrounding apps.
 */

@implementation ABI46_0_0EXFontScalersManager

ABI46_0_0EX_REGISTER_SINGLETON_MODULE(FontScalersManager);

+ (void)initialize
{
  static dispatch_once_t initializeCurrentFontScalersOnce;
  dispatch_once(&initializeCurrentFontScalersOnce, ^{
    currentFontScalers = [NSPointerArray weakObjectsPointerArray];

    Class uiFont = [UIFont class];
    SEL uiUpdate = @selector(fontWithSize:);
    SEL exUpdate = @selector(ABI46_0_0EXFontWithSize:);

    method_exchangeImplementations(class_getInstanceMethod(uiFont, uiUpdate),
                                   class_getInstanceMethod(uiFont, exUpdate));
  });
}

- (void)registerFontScaler:(id<ABI46_0_0EXFontScalerInterface>)fontScaler
{
  [currentFontScalers compact];
  [currentFontScalers addPointer:(__bridge void * _Nullable)(fontScaler)];
}

@end
