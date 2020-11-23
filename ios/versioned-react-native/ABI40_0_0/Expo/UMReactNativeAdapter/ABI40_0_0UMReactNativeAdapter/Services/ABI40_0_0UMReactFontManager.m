// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMReactFontManager.h>
#import <ABI40_0_0UMFontInterface/ABI40_0_0UMFontProcessorInterface.h>
#import <ABI40_0_0React/ABI40_0_0RCTFont.h>
#import <ABI40_0_0UMFontInterface/ABI40_0_0UMFontManagerInterface.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMAppLifecycleService.h>
#import <objc/runtime.h>

static dispatch_once_t initializeCurrentFontProcessorsOnce;

static NSPointerArray *currentFontProcessors;

@implementation ABI40_0_0RCTFont (ABI40_0_0UMReactFontManager)

+ (UIFont *)ABI40_0_0UMUpdateFont:(UIFont *)uiFont
              withFamily:(NSString *)family
                    size:(NSNumber *)size
                  weight:(NSString *)weight
                   style:(NSString *)style
                 variant:(NSArray<NSDictionary *> *)variant
         scaleMultiplier:(CGFloat)scaleMultiplier
{
  UIFont *font;
  for (id<ABI40_0_0UMFontProcessorInterface> fontProcessor in currentFontProcessors) {
    font = [fontProcessor updateFont:uiFont withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
    if (font) {
      return font;
    }
  }

  return [self ABI40_0_0UMUpdateFont:uiFont withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
}

@end

/**
 * This class is responsible for allowing other modules to register as font processors in ABI40_0_0React Native.
 *
 * A font processor is an object conforming to ABI40_0_0UMFontProcessorInterface and is capable of
 * providing an instance of UIFont for given (family, size, weight, style, variant, scaleMultiplier).
 *
 * To be able to hook into ABI40_0_0React Native's way of processing fonts we:
 *  - add a new class method to ABI40_0_0RCTFont, `ABI40_0_0UMUpdateFont:withFamily:size:weight:style:variant:scaleMultiplier`
 *    with ABI40_0_0UMReactFontManager category.
 *  - add a new static variable `currentFontProcessors` holding an array of... font processors. This variable
 *    is shared between the ABI40_0_0RCTFont's category and ABI40_0_0UMReactFontManager class.
 *  - when ABI40_0_0UMReactFontManager is initialized, we exchange implementations of ABI40_0_0RCTFont.updateFont...
 *    and ABI40_0_0RCTFont.ABI40_0_0UMUpdateFont... After the class initialized, which happens only once, calling `ABI40_0_0RCTFont updateFont`
 *    calls in fact implementation we've defined up here and calling `ABI40_0_0RCTFont ABI40_0_0UMUpdateFont` falls back
 *    to the default implementation. (This is why we call `[self ABI40_0_0UMUpdateFont]` at the end of that function,
 *    though it seems like an endless loop, in fact we dispatch to another implementation.)
 *  - When some module adds a font processor using ABI40_0_0UMFontManagerInterface, ABI40_0_0UMReactFontManager adds a weak pointer to it
 *    to currentFontProcessors array.
 *  - Implementation logic of `ABI40_0_0RCTFont.ABI40_0_0UMUpdateFont` uses current value of currentFontProcessors when processing arguments.
 */

@interface ABI40_0_0UMReactFontManager ()

@property (nonatomic, strong) NSMutableSet *fontProcessors;

@end

@implementation ABI40_0_0UMReactFontManager

ABI40_0_0UM_REGISTER_MODULE();

- (instancetype)init
{
  if (self = [super init]) {
    _fontProcessors = [NSMutableSet set];
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI40_0_0UMFontManagerInterface)];
}

+ (void)initialize
{
  dispatch_once(&initializeCurrentFontProcessorsOnce, ^{
    currentFontProcessors = [NSPointerArray weakObjectsPointerArray];
  });

  Class rtcClass = [ABI40_0_0RCTFont class];
  SEL rtcUpdate = @selector(updateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
  SEL exUpdate = @selector(ABI40_0_0UMUpdateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
  
  method_exchangeImplementations(class_getClassMethod(rtcClass, rtcUpdate),
                                 class_getClassMethod(rtcClass, exUpdate));
}

# pragma mark - ABI40_0_0UMFontManager

- (void)addFontProcessor:(id<ABI40_0_0UMFontProcessorInterface>)processor
{
  [_fontProcessors addObject:processor];
  [currentFontProcessors compact];
  [currentFontProcessors addPointer:(__bridge void * _Nullable)(processor)];
}

@end
