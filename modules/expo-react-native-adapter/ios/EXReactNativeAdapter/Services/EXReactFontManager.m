// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXReactNativeAdapter/EXReactFontManager.h>
#import <EXFontInterface/EXFontProcessorInterface.h>
#import <React/RCTFont.h>
#import <EXCore/EXAppLifecycleService.h>
#import <objc/runtime.h>

static __weak NSArray<id<EXFontProcessorInterface>> *currentFontProcessors;

@implementation RCTFont (EXReactFontManager)

+ (UIFont *)EXUpdateFont:(UIFont *)uiFont
              withFamily:(NSString *)family
                    size:(NSNumber *)size
                  weight:(NSString *)weight
                   style:(NSString *)style
                 variant:(NSArray<NSDictionary *> *)variant
         scaleMultiplier:(CGFloat)scaleMultiplier
{
  NSArray<id<EXFontProcessorInterface>> *fontProcessors = currentFontProcessors;
  UIFont *font;
  for (id<EXFontProcessorInterface> fontProcessor in fontProcessors) {
    font = [fontProcessor updateFont:uiFont withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
    if (font) {
      return font;
    }
  }

  return [self EXUpdateFont:uiFont withFamily:family size:size weight:weight style:style variant:variant scaleMultiplier:scaleMultiplier];
}

@end

/**
 * This class is responsible for allowing other modules to register as font processors in React Native.
 *
 * A font processor is an object conforming to EXFontProcessorInterface and is capable of
 * providing an instance of UIFont for given (family, size, weight, style, variant, scaleMultiplier).
 *
 * To be able to hook into React Native's way of processing fonts we:
 *  - add a new class method to RCTFont, `EXUpdateFont:withFamily:size:weight:style:variant:scaleMultiplier`
 *    with EXReactFontManager category.
 *  - add a new static variable `currentFontProcessors` holding an array of... font processors. This variable
 *    is shared between the RCTFont's category and EXReactFontManager class.
 *  - when EXReactFontManager is initialized, we exchange implementations of RCTFont.updateFont...
 *    and RCTFont.EXUpdateFont... After the class initialized, which happens only once, calling `RCTFont updateFont`
 *    calls in fact implementation we've defined up here and calling `RCTFont EXUpdateFont` falls back
 *    to the default implementation. (This is why we call `[self EXUpdateFont]` at the end of that function,
 *    though it seems like an endless loop, in fact we dispatch to another implementation.)
 *  - When some module adds a font processor using EXFontManagerInterface, EXReactFontManager adds it
 *    to fontProcessors array instance variable. The static currentFontProcessors variable should always point
 *    to the fontProcessors array of a foregrounded app/experience (see `- (void)maybeUpdateStaticFontProcessors`).
 *  - Implementation logic of `RCTFont.EXUpdateFont` uses current value of currentFontProcessors when processing arguments.
 */

@interface EXReactFontManager ()

@property (nonatomic, assign) BOOL isForegrounded;
@property (nonatomic, strong) NSMutableArray<id<EXFontProcessorInterface>> *fontProcessors;
@property (nonatomic, weak) id<EXAppLifecycleService> lifecycleManager;

@end

@implementation EXReactFontManager

EX_REGISTER_MODULE();

- (instancetype)init
{
  if (self = [super init]) {
    _isForegrounded = true;
    _fontProcessors = [NSMutableArray array];
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXFontManagerInterface)];
}

+ (void)initialize
{
  Class rtcClass = [RCTFont class];
  SEL rtcUpdate = @selector(updateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
  SEL exUpdate = @selector(EXUpdateFont:withFamily:size:weight:style:variant:scaleMultiplier:);
  
  method_exchangeImplementations(class_getClassMethod(rtcClass, rtcUpdate),
                                 class_getClassMethod(rtcClass, exUpdate));
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if (_lifecycleManager) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }
  
  _lifecycleManager = nil;
  
  if (moduleRegistry) {
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXAppLifecycleService)];
  }
  
  if (_lifecycleManager) {
    [_lifecycleManager registerAppLifecycleListener:self];
  }
}

# pragma mark - EXFontManager

- (void)onAppBackgrounded {
  _isForegrounded = false;
  [self maybeUpdateStaticFontProcessors];
}

- (void)onAppForegrounded {
  _isForegrounded = true;
  [self maybeUpdateStaticFontProcessors];
}

# pragma mark - EXFontManager

- (void)addFontProccessor:(id<EXFontProcessorInterface>)processor
{
  [_fontProcessors addObject:processor];
  [self maybeUpdateStaticFontProcessors];
}

# pragma mark - Internals

- (void)maybeUpdateStaticFontProcessors
{
  if (_isForegrounded) {
    currentFontProcessors = _fontProcessors;
  } else if (currentFontProcessors == _fontProcessors) {
    currentFontProcessors = nil;
  }
}

- (void)dealloc
{
  if (_lifecycleManager) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }
}

@end
