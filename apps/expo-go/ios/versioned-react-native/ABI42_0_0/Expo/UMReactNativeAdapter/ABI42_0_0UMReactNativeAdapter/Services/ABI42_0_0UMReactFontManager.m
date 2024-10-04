// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMReactNativeAdapter/ABI42_0_0UMReactFontManager.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFontProcessorInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFontManagerInterface.h>
#import <ABI42_0_0React/ABI42_0_0RCTFont.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMAppLifecycleService.h>
#import <objc/runtime.h>

static dispatch_once_t initializeCurrentFontProcessorsOnce;

static NSPointerArray *currentFontProcessors;

@implementation ABI42_0_0RCTFont (ABI42_0_0UMReactFontManager)

+ (UIFont *)ABI42_0_0UMUpdateFont:(UIFont *)uiFont
              withFamily:(NSString *)family
                    size:(NSNumber *)size
                  weight:(NSString *)weight
                   style:(NSString *)style
                 variant:(NSArray<NSDictionary *> *)variant
         scaleMultiplier:(CGFloat)scaleMultiplier
{
  UIFont *font;
  for (id<ABI42_0_0EXFontProcessorInterface> fontProcessor in currentFontProcessors) {
    font = [fontProcessor updateFont:uiFont withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
    if (font) {
      return font;
    }
  }

  return [self ABI42_0_0UMUpdateFont:uiFont withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
}

@end

/**
 * This class is responsible for allowing other modules to register as font processors in ABI42_0_0React Native.
 *
 * A font processor is an object conforming to ABI42_0_0UMFontProcessorInterface and is capable of
 * providing an instance of UIFont for given (family, size, weight, style, variant, scaleMultiplier).
 *
 * To be able to hook into ABI42_0_0React Native's way of processing fonts we:
 *  - add a new class method to ABI42_0_0RCTFont, `ABI42_0_0UMUpdateFont:withFamily:size:weight:style:variant:scaleMultiplier`
 *    with ABI42_0_0UMReactFontManager category.
 *  - add a new static variable `currentFontProcessors` holding an array of... font processors. This variable
 *    is shared between the ABI42_0_0RCTFont's category and ABI42_0_0UMReactFontManager class.
 *  - when ABI42_0_0UMReactFontManager is initialized, we exchange implementations of ABI42_0_0RCTFont.updateFont...
 *    and ABI42_0_0RCTFont.ABI42_0_0UMUpdateFont... After the class initialized, which happens only once, calling `ABI42_0_0RCTFont updateFont`
 *    calls in fact implementation we've defined up here and calling `ABI42_0_0RCTFont ABI42_0_0UMUpdateFont` falls back
 *    to the default implementation. (This is why we call `[self ABI42_0_0UMUpdateFont]` at the end of that function,
 *    though it seems like an endless loop, in fact we dispatch to another implementation.)
 *  - When some module adds a font processor using ABI42_0_0UMFontManagerInterface, ABI42_0_0UMReactFontManager adds a weak pointer to it
 *    to currentFontProcessors array.
 *  - Implementation logic of `ABI42_0_0RCTFont.ABI42_0_0UMUpdateFont` uses current value of currentFontProcessors when processing arguments.
 */

@interface ABI42_0_0UMReactFontManager ()

@property (nonatomic, strong) NSMutableSet *fontProcessors;

@end

@implementation ABI42_0_0UMReactFontManager

ABI42_0_0UM_REGISTER_MODULE();

- (instancetype)init
{
  if (self = [super init]) {
    _fontProcessors = [NSMutableSet set];
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI42_0_0EXFontManagerInterface)];
}

+ (void)initialize
{
  dispatch_once(&initializeCurrentFontProcessorsOnce, ^{
    currentFontProcessors = [NSPointerArray weakObjectsPointerArray];
  });

  Class rtcClass = [ABI42_0_0RCTFont class];
  SEL rtcUpdate = @selector(updateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
  SEL exUpdate = @selector(ABI42_0_0UMUpdateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
  
  method_exchangeImplementations(class_getClassMethod(rtcClass, rtcUpdate),
                                 class_getClassMethod(rtcClass, exUpdate));
}

# pragma mark - ABI42_0_0UMFontManager

- (void)addFontProcessor:(id<ABI42_0_0EXFontProcessorInterface>)processor
{
  [_fontProcessors addObject:processor];
  [currentFontProcessors compact];
  [currentFontProcessors addPointer:(__bridge void * _Nullable)(processor)];
}

@end
