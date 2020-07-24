// Copyright 2018-present 650 Industries. All rights reserved.

#import <EDUMReactFontManager.h>
#import <EDUMFontProcessorInterface.h>
#import <React/RCTFont.h>
#import <EDUMFontManagerInterface.h>
#import <EDUMAppLifecycleService.h>
#import <objc/runtime.h>

static dispatch_once_t initializeCurrentFontProcessorsOnce;

static NSPointerArray *currentFontProcessors;

@implementation RCTFont (EDUMReactFontManager)

+ (UIFont *)EDUMUpdateFont:(UIFont *)uiFont
              withFamily:(NSString *)family
                    size:(NSNumber *)size
                  weight:(NSString *)weight
                   style:(NSString *)style
                 variant:(NSArray<NSDictionary *> *)variant
         scaleMultiplier:(CGFloat)scaleMultiplier
{
  UIFont *font;
  for (id<EDUMFontProcessorInterface> fontProcessor in currentFontProcessors) {
    font = [fontProcessor updateFont:uiFont withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
    if (font) {
      return font;
    }
  }

  return [self EDUMUpdateFont:uiFont withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
}

@end

/**
 * This class is responsible for allowing other modules to register as font processors in React Native.
 *
 * A font processor is an object conforming to EDUMFontProcessorInterface and is capable of
 * providing an instance of UIFont for given (family, size, weight, style, variant, scaleMultiplier).
 *
 * To be able to hook into React Native's way of processing fonts we:
 *  - add a new class method to RCTFont, `EDUMUpdateFont:withFamily:size:weight:style:variant:scaleMultiplier`
 *    with EDUMReactFontManager category.
 *  - add a new static variable `currentFontProcessors` holding an array of... font processors. This variable
 *    is shared between the RCTFont's category and EDUMReactFontManager class.
 *  - when EDUMReactFontManager is initialized, we exchange implementations of RCTFont.updateFont...
 *    and RCTFont.EDUMUpdateFont... After the class initialized, which happens only once, calling `RCTFont updateFont`
 *    calls in fact implementation we've defined up here and calling `RCTFont EDUMUpdateFont` falls back
 *    to the default implementation. (This is why we call `[self EDUMUpdateFont]` at the end of that function,
 *    though it seems like an endless loop, in fact we dispatch to another implementation.)
 *  - When some module adds a font processor using EDUMFontManagerInterface, EDUMReactFontManager adds a weak pointer to it
 *    to currentFontProcessors array.
 *  - Implementation logic of `RCTFont.EDUMUpdateFont` uses current value of currentFontProcessors when processing arguments.
 */

@interface EDUMReactFontManager ()

@property (nonatomic, strong) NSMutableSet *fontProcessors;

@end

@implementation EDUMReactFontManager

EDUM_REGISTER_MODULE();

- (instancetype)init
{
  if (self = [super init]) {
    _fontProcessors = [NSMutableSet set];
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EDUMFontManagerInterface)];
}

+ (void)initialize
{
  dispatch_once(&initializeCurrentFontProcessorsOnce, ^{
    currentFontProcessors = [NSPointerArray weakObjectsPointerArray];
  });

  Class rtcClass = [RCTFont class];
  SEL rtcUpdate = @selector(updateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
  SEL exUpdate = @selector(EDUMUpdateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
  
  method_exchangeImplementations(class_getClassMethod(rtcClass, rtcUpdate),
                                 class_getClassMethod(rtcClass, exUpdate));
}

# pragma mark - EDUMFontManager

- (void)addFontProcessor:(id<EDUMFontProcessorInterface>)processor
{
  [_fontProcessors addObject:processor];
  [currentFontProcessors compact];
  [currentFontProcessors addPointer:(__bridge void * _Nullable)(processor)];
}

@end
