//
//  RNHoverHandler.m
//  RNGestureHandler
//
//  Created by Jakub Piasecki on 31/03/2023.
//

#import "RNHoverHandler.h"

#import <React/RCTConvert.h>
#import <UIKit/UIGestureRecognizerSubclass.h>

#define CHECK_TARGET(__VERSION__)                                                \
  defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_##__VERSION__) && \
      __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_##__VERSION__ && !TARGET_OS_TV

typedef NS_ENUM(NSInteger, RNGestureHandlerHoverEffect) {
  RNGestureHandlerHoverEffectNone = 0,
  RNGestureHandlerHoverEffectLift,
  RNGestureHandlerHoverEffectHightlight,
};

#if CHECK_TARGET(13_4)

API_AVAILABLE(ios(13.4))
@interface RNBetterHoverGestureRecognizer : UIHoverGestureRecognizer <UIPointerInteractionDelegate>

- (id)initWithGestureHandler:(RNGestureHandler *)gestureHandler;

@property (nonatomic) RNGestureHandlerHoverEffect hoverEffect;

@end

@implementation RNBetterHoverGestureRecognizer {
  __weak RNGestureHandler *_gestureHandler;
}

- (id)initWithGestureHandler:(RNGestureHandler *)gestureHandler
{
  if ((self = [super initWithTarget:gestureHandler action:@selector(handleGesture:)])) {
    _gestureHandler = gestureHandler;
    _hoverEffect = RNGestureHandlerHoverEffectNone;
  }
  return self;
}

- (void)triggerAction
{
  [_gestureHandler handleGesture:self];
}

- (void)cancel
{
  self.enabled = NO;
}

- (UIPointerStyle *)pointerInteraction:(UIPointerInteraction *)interaction styleForRegion:(UIPointerRegion *)region
{
  if (interaction.view != nil && _hoverEffect != RNGestureHandlerHoverEffectNone) {
    UITargetedPreview *preview = [[UITargetedPreview alloc] initWithView:interaction.view];
    UIPointerEffect *effect = nil;

    if (_hoverEffect == RNGestureHandlerHoverEffectLift) {
      effect = [UIPointerLiftEffect effectWithPreview:preview];
    } else if (_hoverEffect == RNGestureHandlerHoverEffectHightlight) {
      effect = [UIPointerHoverEffect effectWithPreview:preview];
    }

    return [UIPointerStyle styleWithEffect:effect shape:nil];
  }

  return nil;
}

@end

#endif

@implementation RNHoverGestureHandler {
#if CHECK_TARGET(13_4)
  UIPointerInteraction *_pointerInteraction;
#endif
}

- (instancetype)initWithTag:(NSNumber *)tag
{
#if TARGET_OS_TV
  RCTLogWarn(@"Hover gesture handler is not supported on tvOS");
#endif

  if ((self = [super initWithTag:tag])) {
#if CHECK_TARGET(13_4)
    if (@available(iOS 13.4, *)) {
      _recognizer = [[RNBetterHoverGestureRecognizer alloc] initWithGestureHandler:self];
      _pointerInteraction =
          [[UIPointerInteraction alloc] initWithDelegate:(id<UIPointerInteractionDelegate>)_recognizer];
    }
#endif
  }
  return self;
}

- (void)bindToView:(UIView *)view
{
#if CHECK_TARGET(13_4)
  if (@available(iOS 13.4, *)) {
    [super bindToView:view];
    [view addInteraction:_pointerInteraction];
  }
#endif
}

- (void)unbindFromView
{
#if CHECK_TARGET(13_4)
  if (@available(iOS 13.4, *)) {
    [super unbindFromView];
    [self.recognizer.view removeInteraction:_pointerInteraction];
  }
#endif
}

- (void)resetConfig
{
  [super resetConfig];

#if CHECK_TARGET(13_4)
  if (@available(iOS 13.4, *)) {
    RNBetterHoverGestureRecognizer *recognizer = (RNBetterHoverGestureRecognizer *)_recognizer;
    recognizer.hoverEffect = RNGestureHandlerHoverEffectNone;
  }
#endif
}

- (void)configure:(NSDictionary *)config
{
  [super configure:config];

#if CHECK_TARGET(13_4)
  if (@available(iOS 13.4, *)) {
    RNBetterHoverGestureRecognizer *recognizer = (RNBetterHoverGestureRecognizer *)_recognizer;
    APPLY_INT_PROP(hoverEffect);
  }
#endif
}

- (RNGestureHandlerEventExtraData *)eventExtraData:(UIGestureRecognizer *)recognizer
{
  return [RNGestureHandlerEventExtraData forPosition:[recognizer locationInView:recognizer.view]
                                withAbsolutePosition:[recognizer locationInView:recognizer.view.window]];
}

@end
